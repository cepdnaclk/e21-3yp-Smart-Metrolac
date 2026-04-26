#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HX711.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h> 

// --- NTP TIME SETTINGS (Sri Lanka +5:30) ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 19800; // 5.5 hours * 3600 seconds
const int   daylightOffset_sec = 0; // No daylight saving time

// ==========================================
// 1. NETWORK & MQTT CREDENTIALS
// ==========================================
const char* ssid = "Mano-Redmi";        
const char* password = "12345678"; 
const char* mqtt_server = "10.65.152.180";  // Change to your laptop's IP
const int mqtt_port = 1883;
const char* mqtt_topic = "smartmetrolac/device01/telemetry";

WiFiClient espClient;
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

// --- CALIBRATION CONSTANTS ---
float neutralVoltage = 2.33;         // pH 7.0 baseline
float tdsKValue = 1.0;               // TDS Calibration
float weightCalibration = 1770.0;    // Load Cell Baseline
const float PLUMMET_VOLUME = 9.5;    // Must match actual displaced volume in cm3
const float PRICE_PER_KG = 450.0;    // Today's Rubber Price

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

// ==========================================
// 4. MAIN SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  
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
  
  client.setServer(mqtt_server, mqtt_port);
  Serial.println("--- SMART-METROLAC MASTER BOOT ---");
}

// ==========================================
// 5. MAIN LOOP
// ==========================================
void loop() {

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
        
        lcd.setCursor(0, 3); lcd.print("Reading T1...");
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

        for (int sec = 30; sec > 0; sec--) {
          // LCD Update
          lcd.setCursor(0, 2); lcd.print("Time Left: "); 
          if(sec < 10) lcd.print("0"); 
          lcd.print(sec); lcd.print("s   ");
          int bars = ((30 - sec) * 18) / 30;
          lcd.setCursor(1, 3); for(int b = 0; b < bars; b++) lcd.print("|");

          // Read Sensors
          sensors.requestTemperatures();
          float liveTemp = sensors.getTempCByIndex(0);
          float liveWeight = getStableWeight(); // Takes ~750ms
          float livePH = getStablePH();         // Takes ~220ms
          
          // Long-term pH EMA math
          if (sec == 30) phEMA = livePH; 
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
        lcd.setCursor(0, 1); lcd.print("Temperature:"); lcd.print(finalTemp, 0); lcd.print((char)223); lcd.print("C");
        lcd.setCursor(0, 2); lcd.print("pH:"); lcd.print(finalPH, 1);
        lcd.setCursor(10, 2); lcd.print("TDS:"); lcd.print(finalTDS, 0); 
        lcd.setCursor(0, 3); lcd.print("Press [A] for Report");
        needsRedraw = false;
      }
      if (key == 'A') {
        playConfirm();
        isAdulterated = false;
        
        if (finalTDS > 500.0) { isAdulterated = true; alertWarning = "WARN: Salt Detected!"; alertAction  = "ACT: Reject Sample  "; }
        else if (finalPH < 6.0) { isAdulterated = true; alertWarning = "WARN: High Acidity! "; alertAction  = "ACT: Add Ammonia    "; }
        else if (finalPH > 8.0) { isAdulterated = true; alertWarning = "WARN: High Alkaline!"; alertAction  = "ACT: Inspect Sample "; }

        if (isAdulterated) currentState = STATE_ALERTS; 
        else currentState = STATE_INVOICE; 
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
        float payment = batchVolume * finalDRC * PRICE_PER_KG; 
        publishTelemetry(finalDRC, batchVolume, payment);

        lcd.setCursor(0, 0); lcd.print("ID:" + supplierID); lcd.setCursor(15, 0); lcd.print("L:"); lcd.print(batchVolume, 1);
        lcd.setCursor(0, 1); lcd.print("DRC: "); lcd.print(finalDRC, 2);  
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
void drawStatusBar() {
  lcd.setCursor(0, 0); lcd.print("SMART-METROLAC ");
  if (WiFi.status() == WL_CONNECTED) lcd.print("   ON");
  else lcd.print("  OFF");
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

// --- MQTT "ON-DEMAND" PUBLISH ---
void publishTelemetry(float drc, float litres, float payment) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi Offline. Skipping Sync.");
    return;
  }

  // Only try to connect to the server right when we need to send the data
  if (!client.connected()) {
    Serial.print("Connecting to MQTT Server...");
    if (!client.connect("ESP32_SmartMetrolac")) {
      Serial.println(" FAILED. Data not sent.");
      return; // Give up and don't freeze the screen
    }
    Serial.println(" OK!");
  }

  // We are connected! Build and send the JSON payload
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
  
  if (client.publish(mqtt_topic, jsonBuffer)) {
    Serial.println("MQTT Sync Success!");
  }
  
  // Briefly run the loop to ensure the message clears the ESP32's buffer
  client.loop(); 
}

// Audio
void playClick() { tone(BUZZER_PIN, 2500, 30); }
void playConfirm() { tone(BUZZER_PIN, 1500, 100); delay(120); tone(BUZZER_PIN, 2000, 150); }
void playStartup() { tone(BUZZER_PIN, 1000, 150); delay(150); tone(BUZZER_PIN, 1500, 150); delay(150); tone(BUZZER_PIN, 2000, 300); }
void playDoubleBeep() { tone(BUZZER_PIN, 2000, 100); delay(150); tone(BUZZER_PIN, 2000, 100); }
void playWarning() { for (int i=0; i<3; i++) { tone(BUZZER_PIN, 800, 300); delay(400); } }
void playSuccess() { tone(BUZZER_PIN, 1200, 100); delay(100); tone(BUZZER_PIN, 1600, 100); delay(100); tone(BUZZER_PIN, 2400, 300); }

String getLiveTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01T00:00:00"; // Fallback if time fails to sync
  }
  char timeStringBuff[30];
  // Formats exactly like: "2026-04-26T14:30:00"
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(timeStringBuff);
}