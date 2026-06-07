#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HX711.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h> 
#include <LittleFS.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <ThreeWire.h>  
#include <RtcDS1302.h>

// --- NTP TIME SETTINGS (Sri Lanka +5:30) ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 19800; // 5.5 hours * 3600 seconds
const int   daylightOffset_sec = 0; // No daylight saving time

// NEW: Offline Sync Variables
const char* BACKLOG_FILE = "/backlog.txt";
unsigned long lastSyncAttempt = 0;
unsigned long lastClockUpdate = 0;

// ==========================================
// 1. NETWORK & MQTT CREDENTIALS
// ==========================================
const char* ssid = "Mano-Redmi";        
const char* password = "12345678"; 
// const char* mqtt_server = "MY_IP_ADDRESS";  // Change to your laptop's IP
// const int mqtt_port = 1883;
// const char* mqtt_topic = "smartmetrolac/device01/telemetry";

// --- HIVEMQ CLOUD SETTINGS ---
const char* mqtt_server = "YOUR_CLUSTER_URL.s1.eu.hivemq.cloud"; // Replace with your HiveMQ URL
const int mqtt_port = 8883;                                      // Secure Port MUST be 8883
const char* mqtt_username = "YOUR_HIVEMQ_USERNAME";              // Replace with your DB/Hive username
const char* mqtt_password = "YOUR_HIVEMQ_PASSWORD";              // Replace with your DB/Hive password
const char* mqtt_topic = "smartmetrolac/device01/telemetry";

// Initialize the secure client instead of standard client
WiFiClientSecure espClient; 
PubSubClient client(espClient);

const int period = 30;

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ==========================================
// 2. HARDWARE DEFINITIONS & CALIBRATION
// ==========================================
const int collection_center_id = 1;
LiquidCrystal_I2C lcd(0x27, 20, 4); 
const int BUZZER_PIN = 25;

const int RELAY_PIN = 5;
const int PH_PIN = 34;
const int TDS_PIN = 35;
const int ONE_WIRE_BUS = 4;
const int LOADCELL_DOUT_PIN = 18;
const int LOADCELL_SCK_PIN = 19;

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
HX711 scale;

// ThreeWire myWire(DAT/IO, CLK/SCLK, RST/CE);
ThreeWire myWire(2, 15, 23); 
RtcDS1302<ThreeWire> Rtc(myWire);

// --- CALIBRATION CONSTANTS ---
float neutralVoltage = 2.33;         // pH 7.0 baseline
float tdsKValue = 1.0;               // TDS Calibration
float weightCalibration = 1360.0;    // Load Cell Baseline
const float PLUMMET_VOLUME = 5.5;    // Must match actual displaced volume in cm3

// --- REMOVE THIS LINE ---
// const float PRICE_PER_KG = 450.0; 

// --- ADD THESE LINES INSTEAD ---
Preferences preferences;
float pricePerKg = 450.0; // Default fallback, but it will update dynamically
const char* priceApiUrl = "http://10.65.152.180:8080/api/price/current?companyId=1"; // Change to your Spring Boot REST endpoint

// Keypad
const byte ROWS = 4; const byte COLS = 4;
char hexaKeys[ROWS][COLS] = {
  {'1','2','3','A'}, {'4','5','6','B'}, {'7','8','9','C'}, {'*','0','#','D'}
};
byte rowPins[ROWS] = {13, 14, 27, 26}; 
byte colPins[COLS] = {33, 32, 17, 16}; 
Keypad customKeypad = Keypad(makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS); 

// ==========================================
// 3. STATE MACHINE & GLOBALS
// ==========================================
enum SystemState { 
  STATE_BOOT = 0, 
  STATE_AUTH, 
  STATE_VOLUME, 
  STATE_INSTRUCT_AIR, 
  STATE_INSTRUCT_LATEX, 
  STATE_MEASURE_LATEX, 
  STATE_RAW_DATA, 
  STATE_ALERTS, 
  STATE_INVOICE 
};
SystemState currentState = STATE_BOOT;
bool needsRedraw = true; 

// Session Data Memory
String supplierID = "";
String batchVolumeStr = "";
float batchVolume = 0.0;

float weightAirT1 = 0.0;
float finalWeight = 0.0;
float finalTemp = 0.0;
float finalPH = 0.0;
float finalTDS = 0.0;
float finalDRC = 0.0;

// Quality Control Flags
bool isAdulterated = false;
String alertWarning = "";
String alertAction = "";

// --- NEW: Non-Blocking Network Timer ---
unsigned long lastReconnectAttempt = 0;

void syncRTCwithNTP() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    RtcDateTime preciseTime = RtcDateTime(
        timeinfo.tm_year + 1900,
        timeinfo.tm_mon + 1,
        timeinfo.tm_mday,
        timeinfo.tm_hour,
        timeinfo.tm_min,
        timeinfo.tm_sec
    );
    Rtc.SetDateTime(preciseTime);
    Serial.println("SUCCESS: DS1302 RTC Synced with Internet Time!");
  } else {
    Serial.println("WARNING: Offline mode. Relying on DS1302 battery backup.");
  }
}

// ==========================================
// 4. MAIN SETUP
// ==========================================
void setup() {
  Serial.begin(115200);

  // Initialize Preferences and load the last saved price
  preferences.begin("metrolac", false); 
  pricePerKg = preferences.getFloat("rubberPrice", 450.0); // 450.0 is the default if nothing is saved yet
  Serial.print("Loaded Offline Price: Rs. ");
  Serial.println(pricePerKg);

  // NEW: Initialize LittleFS
  if (!LittleFS.begin(true)) { // 'true' formats the drive if it fails to mount
    Serial.println("LittleFS Mount Failed!");
  } else {
    Serial.println("LittleFS Mounted Successfully.");
  }
  
  lcd.init(); lcd.backlight();
  pinMode(BUZZER_PIN, OUTPUT); digitalWrite(BUZZER_PIN, LOW);
  
  // Relay OFF (High)
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); 
  
  pinMode(PH_PIN, INPUT); pinMode(TDS_PIN, INPUT);
  
  sensors.begin(); sensors.setWaitForConversion(false); sensors.requestTemperatures(); 
  
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(weightCalibration);
  // NO scale.tare()! We are using differential measurement.
  
  setup_wifi(); // Connect to Wi-Fi
  
  // NEW: Tell the ESP32 to accept the TLS connection without verifying the root CA
  espClient.setInsecure();

  client.setServer(mqtt_server, mqtt_port); // client.setCallback(callback); // Keep this if you have a callback for receiving prices!

  // Initialize the DS1302 RTC
  Rtc.Begin();
  if (!Rtc.GetIsRunning()) Rtc.SetIsRunning(true);
  if (Rtc.GetIsWriteProtected()) Rtc.SetIsWriteProtected(false);
  
  Serial.println("--- SMART-METROLAC MASTER BOOT ---");
}

// ==========================================
// 5. MAIN LOOP
// ==========================================
void loop() {
  // --- BACKGROUND OFFLINE SYNC (IDLE ONLY) ---
  // Only attempts sync every 10 seconds IF sitting at the start screen with no keys typed
  if (millis() - lastSyncAttempt > 10000) {
    lastSyncAttempt = millis();
    if (currentState == STATE_AUTH && supplierID.length() == 0) {
      syncOfflineData();
    }
  }

  // --- NEW: LIVE CLOCK TICKER ---
  if (millis() - lastClockUpdate > 1000) {
    lastClockUpdate = millis();
    // Only tick the clock on the Standby and Volume Input screens
    if (currentState == STATE_AUTH || currentState == STATE_VOLUME) {
      drawStatusBar();
    }
  }

  // --- KEYPAD POLLING ---
  char key = customKeypad.getKey();
  if (key) playClick();

  switch (currentState) {
    case STATE_BOOT:
      if (needsRedraw) {
        lcd.clear();
        lcd.setCursor(0, 0); lcd.print(" SMART-METROLAC Pro ");
        lcd.setCursor(0, 1); lcd.print(" Connecting Wi-Fi.. ");
        playStartup();
        
        WiFi.begin(ssid, password);
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 15) {
          delay(500); Serial.print("."); lcd.setCursor(attempts, 2); lcd.print("."); attempts++;
        }
        lcd.setCursor(0, 3);
        if (WiFi.status() == WL_CONNECTED) {
          lcd.print(" [WIFI: OK]         ");
          configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

          // --- NEW SYNC LOGIC ---
          delay(1500); // Give NTP a moment to fetch the time
          syncRTCwithNTP(); 
          // ----------------------

        } else {
          lcd.print(" [WIFI: OFFLINE]    ");
        }
        
        delay(2000); currentState = STATE_AUTH; needsRedraw = true;
      }
      break;

    case STATE_AUTH:
      if (needsRedraw) {
        lcd.clear(); drawStatusBar();
        lcd.setCursor(0, 1); lcd.print("Enter Farmer ID:    ");
        lcd.setCursor(0, 2); lcd.print("> " + supplierID);
        lcd.setCursor(0, 3); lcd.print("[A]=Confirm  [B]=Del");
        needsRedraw = false;
      }
      if (key) {
    // ✅ Allow only digits, limit to 4 chars
    if (isDigit(key) && supplierID.length() < 4) {
      supplierID += key;
      needsRedraw = true;
    } 
    // ✅ Confirm
    else if (key == 'A' && supplierID.length() > 0) {
      playConfirm(); 
      currentState = STATE_VOLUME; 
      needsRedraw = true;
    } 
    // ✅ Backspace (delete last char)
    else if (key == 'B' && supplierID.length() > 0) {
      supplierID.remove(supplierID.length() - 1);
      needsRedraw = true;
    }
  }
  break;

    case STATE_VOLUME:
      if (needsRedraw) {
        lcd.clear(); drawStatusBar();
        lcd.setCursor(0, 1); lcd.print("Enter Volume (L):   ");
        lcd.setCursor(0, 2); lcd.print("> " + batchVolumeStr);
        lcd.setCursor(0, 3); lcd.print("[A]=Confirm");
        needsRedraw = false;
      }
      if (key) {
        if (isDigit(key) && batchVolumeStr.length() < 8) { batchVolumeStr += key; needsRedraw = true; } 
        else if (key == '*' && batchVolumeStr.indexOf('.') == -1) { batchVolumeStr += "."; needsRedraw = true; } 
        else if (key == 'A' && batchVolumeStr.length() > 0) { 
          batchVolume = batchVolumeStr.toFloat();
          playConfirm(); currentState = STATE_INSTRUCT_AIR; needsRedraw = true; 
        } 
        else if (key == 'C') { batchVolumeStr = ""; needsRedraw = true; }
      }
      break;

    case STATE_INSTRUCT_AIR:
      if (needsRedraw) {
        lcd.clear(); drawStatusBar();
        lcd.setCursor(0, 1); lcd.print("1. Hang Plummet Dry ");
        lcd.setCursor(0, 3); lcd.print("Press [A] to Weigh  ");
        needsRedraw = false;
      }
      if (key == 'A') { 
        playConfirm(); 
        lcd.clear(); drawStatusBar();
        lcd.setCursor(0, 1); lcd.print("Hands Off!");
        lcd.setCursor(0, 2); lcd.print("Stabilizing ...");
        delay(3000); // Give plummet time to stop swinging
        
        lcd.setCursor(0, 3); lcd.print("Reading ...");
        weightAirT1 = getStableWeight();
        
        Serial.print("\n>>> T1 (AIR) LOCKED: "); Serial.print(weightAirT1, 1); Serial.println("g");
        
        playDoubleBeep();
        currentState = STATE_INSTRUCT_LATEX; 
        needsRedraw = true; 
      }
      break;

    case STATE_INSTRUCT_LATEX:
      if (needsRedraw) {
        lcd.clear(); drawStatusBar();
        lcd.setCursor(0, 1); lcd.print("2. Dip Plummet &    ");
        lcd.setCursor(0, 2); lcd.print("   Probes in Latex. ");
        lcd.setCursor(0, 3); lcd.print("Press [A] to Start  ");
        needsRedraw = false;
      }
      if (key == 'A') { playConfirm(); currentState = STATE_MEASURE_LATEX; needsRedraw = true; }
      break;

    case STATE_MEASURE_LATEX:
      if (needsRedraw) {
        lcd.clear(); drawStatusBar();
        lcd.setCursor(0, 1); lcd.print("Analyzing Sample... ");
        
        Serial.println("\n==================================================");
        Serial.println("Starting 30-Second Stabilization Sequence...");
        
        float phEMA = 0.0;

        for (int sec = period; sec > 0; sec--) {
          // LCD Update
          lcd.setCursor(0, 2); lcd.print("Time Left: "); 
          if(sec < 10) lcd.print("0"); 
          lcd.print(sec); lcd.print("s   ");
          int bars = ((period - sec) * 18) / period;
          lcd.setCursor(1, 3); for(int b = 0; b < bars; b++) lcd.print("|");

          // Read Sensors
          sensors.requestTemperatures();
          float liveTemp = sensors.getTempCByIndex(0);
          float liveWeight = getStableWeight(); // Takes ~750ms
          float livePH = getStablePH();         // Takes ~220ms
          
          // Long-term pH EMA math
          if (sec == period) phEMA = livePH; 
          else if (sec > 5) phEMA = (livePH * 0.15) + (phEMA * 0.85);

          // Serial Monitor Output
          Serial.print("["); if (sec < 10) Serial.print("0"); Serial.print(sec); Serial.print("s] -> ");
          Serial.print("Wgt: "); Serial.print(liveWeight, 1); Serial.print("g | ");
          Serial.print("Temp: "); Serial.print(liveTemp, 1); Serial.print("C | ");

          if (sec > 5) {
            Serial.print("Live pH: "); Serial.print(livePH, 2); Serial.println(" | TDS: OFF");
          } 
          else if (sec == 5) {
            finalPH = phEMA; 
            Serial.print("LOCKED pH: "); Serial.print(finalPH, 2); Serial.println(" | TDS: <TURNING ON>");
            digitalWrite(RELAY_PIN, LOW); // TDS ON
          } 
          else if (sec < 5 && sec > 2) {
            float liveTDS = getStableTDS(liveTemp);
            Serial.print("LOCKED pH: "); Serial.print(finalPH, 2); Serial.print(" | Live TDS: "); Serial.print(liveTDS, 0); Serial.println(" ppm");
          } 
          else if (sec == 2) {
            finalTDS = getStableTDS(liveTemp);
            Serial.print("LOCKED pH: "); Serial.print(finalPH, 2); Serial.print(" | LOCKED TDS: "); Serial.print(finalTDS, 0); Serial.println(" ppm");
            digitalWrite(RELAY_PIN, HIGH); // TDS OFF
          } 
          else if (sec == 1) {
            finalTemp = liveTemp;
            finalWeight = liveWeight;
            Serial.print("LOCKED pH: "); Serial.print(finalPH, 2); Serial.print(" | LOCKED TDS: "); Serial.print(finalTDS, 0); Serial.println(" ppm");
          }
        }

        // --- MATH PHASE ---
        float displacedMass = weightAirT1 - finalWeight; 
        float density = displacedMass / PLUMMET_VOLUME;
        float metrolacReading = (1.0067 - density) / 0.00004467;
        float drcRaw = 0.1 + (0.002 * metrolacReading) - (0.01 * (finalTemp - 29.0));
        
        finalDRC = round(drcRaw * 100.0) / 100.0; // Convert to %
        if (finalDRC < 0) finalDRC = 0.0;

        playDoubleBeep(); 
        currentState = STATE_RAW_DATA; 
        needsRedraw = true;
      }
      break;

    case STATE_RAW_DATA:
      if (needsRedraw) {
        lcd.clear(); drawStatusBar();
        lcd.setCursor(0, 1); lcd.print("Temp:"); lcd.print(finalTemp, 0); lcd.print((char)223); lcd.print("C");
        lcd.setCursor(0, 2); lcd.print("pH:"); lcd.print(finalPH, 1);
        lcd.setCursor(10, 2); lcd.print("TDS:"); lcd.print(finalTDS, 0); 
        lcd.setCursor(0, 3); lcd.print("Press [A] for Report");
        needsRedraw = false;
      }
      if (key == 'A') {
        playConfirm();
        
        // 1. Evaluate all conditions independently
        bool hasSalt = (finalTDS > 500.0);
        bool isAcidic = (finalPH < 6.0);
        bool isAlkaline = (finalPH > 8.0);

        // 2. Determine if ANY adulteration exists
        isAdulterated = (hasSalt || isAcidic || isAlkaline);
        
        // 3. Set the specific warnings based on combinations
        if (isAdulterated) {
            if (hasSalt && isAcidic) {
                alertWarning = "WARN: Salt & Acidic!";
                alertAction  = "ACT: Reject Sample  "; // Reject always overrides adding ammonia
            } 
            else if (hasSalt && isAlkaline) {
                alertWarning = "WARN: Salt & Alkalin"; 
                alertAction  = "ACT: Reject Sample  "; 
            } 
            else if (hasSalt) {
                alertWarning = "WARN: Salt Detected!";
                alertAction  = "ACT: Reject Sample  ";
            } 
            else if (isAcidic) {
                alertWarning = "WARN: High Acidity! ";
                alertAction  = "ACT: Add Ammonia    ";
            } 
            else if (isAlkaline) {
                alertWarning = "WARN: High Alkaline!";
                alertAction  = "ACT: Inspect Sample ";
            }
            
            currentState = STATE_ALERTS; 
        } 
        else {
            currentState = STATE_INVOICE; 
        }
        
        needsRedraw = true;
      }
      break;

    case STATE_ALERTS:
      if (needsRedraw) {
        lcd.clear();
        lcd.setCursor(0, 0); lcd.print("--- QUALITY ALERT --");
        lcd.setCursor(0, 1); lcd.print(alertWarning);
        lcd.setCursor(0, 2); lcd.print(alertAction);
        lcd.setCursor(0, 3); lcd.print("Press [A] to Proceed");
        playWarning(); needsRedraw = false;
      }
      if (key == 'A') { playConfirm(); currentState = STATE_INVOICE; needsRedraw = true; }
      break;

    case STATE_INVOICE:
      if (needsRedraw) {
        lcd.clear();
        lcd.setCursor(0, 0); lcd.print("Fetching Price..."); // Optional: tell user why it's pausing
        
        fetchDailyPrice(); // <--- MOVED INSIDE THE GATEKEEPER

        lcd.clear();
        float payment = batchVolume * finalDRC * pricePerKg; 
        publishTelemetry(finalDRC, batchVolume, payment);

        lcd.setCursor(0, 0); lcd.print("ID:" + supplierID); lcd.setCursor(9, 0); lcd.print("Rs"); lcd.print(pricePerKg, 2); lcd.print("/kg");
        lcd.setCursor(0, 1); lcd.print("DRC: "); lcd.print(finalDRC, 2); lcd.setCursor(13, 1); lcd.print("L:"); lcd.print(batchVolume, 2);
        lcd.setCursor(0, 2); lcd.print("PAY: Rs."); lcd.print(payment, 2);
        lcd.setCursor(0, 3); lcd.print("[*]New User Session ");
        playSuccess(); needsRedraw = false;
      }
      if (key == '*') {
        playConfirm(); 
        supplierID = ""; batchVolumeStr = ""; batchVolume = 0; 
        currentState = STATE_AUTH; needsRedraw = true;
      }
      break;
  }
}

// ==========================================
// 6. HELPER FUNCTIONS
// ==========================================

void fetchDailyPrice() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Fetching daily price from backend...");
    
    HTTPClient http;
    http.begin(priceApiUrl);
    int httpResponseCode = http.GET(); // Send the HTTP GET request

    if (httpResponseCode == 200) { 
      String response = http.getString();
      
      // Parse the JSON Object
      StaticJsonDocument<512> doc;
      DeserializationError error = deserializeJson(doc, response);

      if (!error) {
        // Target the exact key from your Postman output
        float fetchedPrice = doc["pricePerKg"]; 

        if (fetchedPrice > 0) {
          pricePerKg = fetchedPrice;
          // Save it permanently to ESP32 flash memory
          preferences.putFloat("rubberPrice", pricePerKg);
          Serial.print(" SUCCESS! New Price Saved: Rs. ");
          Serial.println(pricePerKg);
        } else {
           Serial.println(" ERROR: Parsed price is 0.");
        }
      } else {
        Serial.print(" JSON Parsing Failed: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.print(" FAILED. HTTP Code: ");
      Serial.println(httpResponseCode);
    }
    http.end(); // Free the resources
  }
}

void drawStatusBar() {
  RtcDateTime now = Rtc.GetDateTime();
  char statusBuffer[21];
  
  // Format Wi-Fi status to always take exactly 3 characters so it aligns perfectly
  String wifiStatus = (WiFi.status() == WL_CONNECTED) ? "ON " : "OFF";

  if (now.IsValid()) {
    // Format: "DD/MM/YYYY HH:MM OFF" (Exactly 20 chars)
    snprintf(statusBuffer, sizeof(statusBuffer), "%02d/%02d/%04d %02d:%02d %s",
             now.Day(), now.Month(), now.Year(),
             now.Hour(), now.Minute(), wifiStatus.c_str());
  } else {
    // Failsafe just in case the battery dies
    snprintf(statusBuffer, sizeof(statusBuffer), "SMART-METROLAC   %s", wifiStatus.c_str());
  }

  lcd.setCursor(0, 0); // Only target the top row
  lcd.print(statusBuffer);
}

float getStableWeight() {
  float localEMA = 0.0;
  bool firstRead = true;
  for(int i = 0; i < 15; i++) { // 15 readings * 50ms = 750ms
    float rawWeight = scale.get_units(1);
    if (firstRead) { localEMA = rawWeight; firstRead = false; } 
    else { localEMA = (rawWeight * 0.15) + (localEMA * 0.85); }
    delay(50);
  }
  return localEMA;
}

float getStablePH() {
  int buf[11], temp;
  for(int i = 0; i < 11; i++) { buf[i] = analogRead(PH_PIN); delay(20); } // 220ms
  for(int i = 0; i < 10; i++) { for(int j = i+1; j < 11; j++) { if(buf[i] > buf[j]) { temp = buf[i]; buf[i] = buf[j]; buf[j] = temp; } } }
  float voltage = (buf[5]) * (3.3 / 4095.0);
  return 7.0 + ((neutralVoltage - voltage) * 5.70);
}

float getStableTDS(float tempC) {
  int buf[11], temp;
  for(int i = 0; i < 11; i++) { buf[i] = analogRead(TDS_PIN); delay(20); } // 220ms
  for(int i = 0; i < 10; i++) { for(int j = i+1; j < 11; j++) { if(buf[i] > buf[j]) { temp = buf[i]; buf[i] = buf[j]; buf[j] = temp; } } }
  float voltage = (buf[5]) * (3.3 / 4095.0);
  float compVolt = voltage / (1.0 + 0.02 * (tempC - 25.0));
  float tds = (133.42 * pow(compVolt, 3) - 255.86 * pow(compVolt, 2) + 857.39 * compVolt) * 0.5 * tdsKValue;
  return (tds < 0) ? 0 : tds;
}

// --- MQTT "ON-DEMAND" PUBLISH WITH STORE-AND-FORWARD ---
void publishTelemetry(float drc, float litres, float payment) {
  StaticJsonDocument<256> doc;
  doc["farmer_id"] = supplierID.toInt();
  doc["collection_center_id"] = collection_center_id;
  doc["drc"] = drc;
  doc["total_litres"] = litres;
  doc["total_amount"] = payment;
  doc["temperature"] = finalTemp;
  doc["ph_status"] = (finalPH < 6.0 || finalPH > 8.0) ? "warning" : "normal";
  doc["tds_status"] = (finalTDS > 500) ? "warning" : "normal";
  doc["measurement_datetime"] = getLiveTime();
  
  char jsonBuffer[256]; 
  serializeJson(doc, jsonBuffer);

  // Attempt to Connect & Publish
  bool publishSuccess = false;
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) {
      Serial.print("Connecting to HiveMQ...");
      // NEW: Generate a random ID and connect using HiveMQ Username/Password
      String clientId = "SmartMetrolac-" + String(random(0xffff), HEX);
      client.connect(clientId.c_str(), mqtt_username, mqtt_password);
    }
    if (client.connected() && client.publish(mqtt_topic, jsonBuffer)) {
      publishSuccess = true;
      Serial.println("MQTT Sync Success!");
      client.loop(); 
    }
  }

  // FALLBACK: Store to Flash Memory if Publish Failed
  if (!publishSuccess) {
    Serial.println("Network offline. Saving invoice to LittleFS...");
    File file = LittleFS.open(BACKLOG_FILE, FILE_APPEND);
    if (!file) {
      Serial.println("CRITICAL ERROR: Could not open backlog file!");
      return;
    }
    file.println(jsonBuffer); // Append data with a newline
    file.close();
    Serial.println("Offline data saved successfully.");
  }
}

// Audio
void playClick() { tone(BUZZER_PIN, 2500, 30); }
void playConfirm() { tone(BUZZER_PIN, 1500, 100); delay(120); tone(BUZZER_PIN, 2000, 150); }
void playStartup() { tone(BUZZER_PIN, 1000, 150); delay(150); tone(BUZZER_PIN, 1500, 150); delay(150); tone(BUZZER_PIN, 2000, 300); }
void playDoubleBeep() { tone(BUZZER_PIN, 2000, 100); delay(150); tone(BUZZER_PIN, 2000, 100); }
void playWarning() { for (int i=0; i<3; i++) { tone(BUZZER_PIN, 800, 300); delay(400); } }
void playSuccess() { tone(BUZZER_PIN, 1200, 100); delay(100); tone(BUZZER_PIN, 1600, 100); delay(100); tone(BUZZER_PIN, 2400, 300); }

String getLiveTime() {
  RtcDateTime now = Rtc.GetDateTime();
  
  // Failsafe in case the RTC gets unplugged or battery dies
  if (!now.IsValid()) {
    return "1970-01-01T00:00:00"; 
  }

  char timeStringBuff[30];
  // Formats exactly like: "2026-04-26T14:30:00"
  snprintf(timeStringBuff, sizeof(timeStringBuff), "%04d-%02d-%02dT%02d:%02d:%02d",
           now.Year(), now.Month(), now.Day(),
           now.Hour(), now.Minute(), now.Second());
           
  return String(timeStringBuff);
}

void syncOfflineData() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  // Warning: If broker is offline, this next line blocks for ~3-5 seconds.
  // Because we only run this in STATE_AUTH when idle, it won't interrupt the user.
  if (!client.connected()) {
    // NEW: Generate a random ID and connect using HiveMQ Username/Password
    String clientId = "SmartMetrolac-" + String(random(0xffff), HEX);
    if (!client.connect(clientId.c_str(), mqtt_username, mqtt_password)) return;
  }

  if (!LittleFS.exists(BACKLOG_FILE)) return; 

  File file = LittleFS.open(BACKLOG_FILE, FILE_READ);
  if (!file || file.size() == 0) return;

  Serial.println("\n--- BACKGROUND SYNC START ---");
  
  File tempFile = LittleFS.open("/temp.txt", FILE_WRITE);
  bool allSynced = true;

  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim(); 
    
    if (line.length() > 0) {
      if (client.connected() && client.publish(mqtt_topic, line.c_str())) {
        Serial.println("Synced: " + line);
        client.loop(); // Keep buffer clear
        // Note: delay(100) removed! Blasts data to local Spring Boot instantly.
      } else {
        Serial.println("Connection lost! Pausing sync...");
        tempFile.println(line);
        allSynced = false;
      }
    }
  }
  
  file.close();
  tempFile.close();

  if (allSynced) {
    LittleFS.remove(BACKLOG_FILE); 
    LittleFS.remove("/temp.txt");
    Serial.println("--- SYNC COMPLETE ---");
  } else {
    LittleFS.remove(BACKLOG_FILE);
    LittleFS.rename("/temp.txt", BACKLOG_FILE);
  }
}