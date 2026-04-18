# SMART-METROLAC: ROADMAP WITH ROLE ASSIGNMENTS

**8 Weeks | 3 Roles | Clear Phases**

---

## 🎯 PART 1: BIG PICTURE (The Entire Process)

### **What Gets Built (High Level)**

```
PROCESS 1: SETUP & FOUNDATION (Week 1-2)
├─ Backend Dev: Database + Entities + Repositories        ✅ DONE
├─ Firmware Dev: Hardware setup + Sensor libraries
└─ Frontend Dev: React project + UI/UX design

PROCESS 2: CORE IMPLEMENTATION (Week 3-4)
├─ Backend Dev: Services + APIs + Security                🔜 NEXT
├─ Firmware Dev: Sensor code + Offline storage
└─ Frontend Dev: Components + Mock data

PROCESS 3: INTEGRATION (Week 5-6)
├─ Backend Dev: MQTT consumer + Testing                   ✅ DONE (MQTT pipeline)
├─ Firmware Dev: WiFi + MQTT client + Device-to-backend sync
└─ Frontend Dev: Real API integration + Live data

PROCESS 4: TESTING & LAUNCH (Week 7-8)
├─ Backend Dev: Unit tests + Performance + Documentation
├─ Firmware Dev: Device testing + Calibration
└─ Frontend Dev: UI polish + Deployment
```

---

### **Data Flow (What Happens in the System)**

```
ESP32 Device (Firmware)
    ↓ (Measures, calculates offline)
    ↓ (When WiFi available, sends via MQTT)
    
MQTT Broker
    ↓ (Forwards JSON payload)
    
Spring Boot Backend
    ↓ (Receives, processes, validates, detects fraud)   ✅ WORKING
    ↓ (Saves to database)
    
PostgreSQL Database
    ↓ (Stores data)                                     ✅ WORKING
    
React Frontend
    ↓ (Queries backend APIs)
    ↓ (Shows real-time dashboard)
    
Farmer/Admin/Manager
    ↓ (Views measurements, payments, analytics)
```

---

### **Parallel Work Opportunities**

```
WEEKS 1-2: 100% PARALLEL
Backend: Database setup                                   ✅ DONE
Firmware: Sensor setup
Frontend: UI design
→ No dependencies, all start simultaneously

WEEKS 3-4: 90% PARALLEL
Backend: Services & APIs                                  🔜 NEXT
Firmware: Sensor code & offline storage
Frontend: Components & styling
→ Minor dependency: Backend must define API format early

WEEK 5: 50% PARALLEL
Backend + Firmware: MUST sync (MQTT format)               ✅ MQTT backend side done
Frontend: Independent (continues with API integration)
→ Critical sync point

WEEKS 6-8: 70% PARALLEL
All three converge for testing and launch
Some work together, some independent
```

---

## 📋 PART 2: DETAILED PHASES BY ROLE

---

# 🔧 PHASE 1: FOUNDATION (Weeks 1-2) — ✅ BACKEND COMPLETE

## Backend Developer Tasks

### Week 1: Database Layer

**Days 1-1:**
```
✅ Create PostgreSQL database: smart_metrolac
✅ Create user: smartmetrolac_user with password
✅ Run schema.sql (create 8 tables from ER diagram)
✅ Insert test data:
  - 1 company
  - 1 collection center
  - 2 farmers
  - 1 device
  - 2 invoices
  - 2 payments
  - 2 alerts
```

**Verification:**
```bash
psql -U smartmetrolac_user -d smart_metrolac
SELECT * FROM "user";  # Shows test users ✅
```

---

### Week 1: JPA Entities

**Days 2-3:**
```
✅ All 8 entity classes created in: src/main/java/.../entity/
  - UserEntity.java      ✅
  - Company.java         ✅
  - CollectionCenter.java ✅
  - Device.java          ✅
  - Farmer.java          ✅
  - Invoice.java         ✅
  - Payment.java         ✅ (added later, was missing)
  - Alert.java           ✅
  
✅ Verified: mvn clean compile → BUILD SUCCESS
```

---

### Week 1: Repositories

**Days 4-5:**
```
✅ All 8 repositories created in: src/main/java/.../repository/
  - UserRepository.java              ✅ (needs findByUsername for auth)
  - CompanyRepository.java           ✅
  - CollectionCenterRepository.java  ✅
  - DeviceRepository.java            ✅ (has findByCollectionCenter)
  - FarmerRepository.java            ✅
  - InvoiceRepository.java           ✅ (has aggregateLitresPerCenterForPeriod)
  - PaymentRepository.java           ✅
  - AlertRepository.java             ✅ (has findTop20ByOrderByCreatedDateDesc)

✅ Verified: mvn clean compile → BUILD SUCCESS
```

---

### Week 2: Services

**Days 1-3:**
```
✅ MqttMeasurementService.java  — full MQTT ingestion pipeline
✅ AdminDashboardService.java   — KPI aggregations for admin dashboard
⬜ UserService
⬜ CompanyService
⬜ CollectionCenterService
⬜ FarmerService
⬜ DeviceService
⬜ InvoiceService (with fraud detection)
⬜ PaymentService (with weekly calculation)
⬜ AlertService
```

---

### Week 2: Security Config

**Days 4-5:**
```
⬜ SecurityConfig.java          — 📍 NEXT TASK
⬜ JwtTokenProvider.java
⬜ JwtAuthFilter.java
⬜ AuthenticationService.java
```

---

### **Backend Phase 1 Deliverable Status:**
✅ Database created + populated  
✅ 8 entities working  
✅ 8 repositories working  
✅ MQTT pipeline implemented (bonus — done early)  
✅ Admin dashboard service (bonus — done early)  
⬜ 7 remaining business services  
⬜ Spring Security / JWT  

---

## 🔌 Firmware Developer Tasks

### Week 1: Environment Setup

**Days 1-2:**
```
□ Install Arduino IDE
□ Add ESP32 board: https://dl.espressif.com/...
□ Install libraries (Sketch → Include Library → Manage...):
  - HX711 (load cell)
  - Dallas Temperature (DS18B20)
  - pH sensor library
  - TDS sensor library
  - LiquidCrystal_I2C (LCD display)
  - Keypad library
  - PubSubClient (MQTT)
```

---

### Week 1-2: Sensor Implementation

**Days 3-5:**
```
□ Implement HX711 load cell reading
□ Implement DS18B20 temperature sensor
□ Implement pH sensor reading
□ Implement TDS sensor reading
□ Implement LCD display
□ Implement 4x4 keypad
□ Implement passive buzzer
```

---

### Week 2: Offline Storage & DRC Calculation

**Days 1-3:**
```
□ Set up offline storage (EEPROM or SD card)
□ Implement DRC calculation formula
□ Implement temperature compensation
□ Create local invoice object
```

---

### Week 2: Input & Feedback

**Days 4-5:**
```
□ Design keypad input sequence
□ Implement input validation
□ Show feedback on LCD
```

---

### **Firmware Week 1-2 Deliverable:**
□ All 7 sensors reading correctly  
□ LCD displaying information  
□ Keypad input working  
□ DRC calculation implemented  
□ Offline storage working  
□ Buzzer feedback working  

---

## 🎨 Frontend Developer Tasks

### Week 1: Project Setup & Design

**Days 1-2:**
```
□ Create React project
□ Install dependencies (react-router-dom, axios, redux, tailwindcss)
□ Configure Tailwind CSS
□ Create folder structure
```

---

### Week 1-2: UI Design & Wireframes

**Days 3-5:**
```
□ Create wireframes:
  Page 1: Login
  Page 2: Farmer Dashboard
  Page 3: Collection Center Admin Dashboard
  Page 4: Company Admin Dashboard
  Page 5: Invoice Details
□ Define color scheme
□ Define typography
□ Decide responsive breakpoints
```

---

### Week 1-2: Project Structure

**Days 1-5:**
```
□ Set up React Router (public + protected routes)
□ Create layout component (Header, Sidebar, Footer)
□ Set up Redux (auth, data, ui slices)
□ Create API service file (axios + JWT header)
```

---

### **Frontend Week 1-2 Deliverable:**
□ React project created  
□ Folder structure organized  
□ Wireframes completed  
□ Tailwind CSS configured  
□ React Router set up  
□ Redux structure ready  
□ Layout component built  

---

---

# 🔨 PHASE 2: CORE IMPLEMENTATION (Weeks 3-4) — 📍 BACKEND NEXT

## Backend Developer Tasks

### Week 3: Spring Security + JWT  ← START HERE

**Days 1-2 (IMMEDIATE NEXT STEP):**
```
⬜ Add spring-boot-starter-security to pom.xml
⬜ Add spring-boot-starter-validation to pom.xml
⬜ SecurityConfig.java
⬜ JwtTokenProvider.java
⬜ JwtAuthFilter.java
⬜ AuthenticationService.java
⬜ POST /api/auth/login endpoint
```

---

### Week 3: REST Controllers

**Days 3-5:**
```
⬜ AuthController     (POST /login, POST /register)
⬜ UserController     (GET, PUT user)
⬜ CompanyController  (CRUD)
⬜ CollectionCenterController (CRUD)
⬜ DeviceController   (CRUD)
⬜ FarmerController   (CRUD)
⬜ InvoiceController  (POST /submit, GET /list, GET /{id})
⬜ PaymentController  (GET, POST)
⬜ AlertController    (GET unresolved, PUT resolve)
⬜ DashboardController (GET farmer, center, company)

Note: AdminDashboardController already exists ✅
      TestController exists but should be removed before deployment
```

---

### Week 3-4: DTOs & Data Contracts

**Days 3-4:**
```
⬜ LoginRequest (username, password)
⬜ RegisterRequest (username, email, password)
⬜ InvoiceDTO
⬜ MeasurementDTO (from device MQTT payload)
⬜ DashboardDTO (invoices, payments, analytics)
⬜ PaymentDTO
⬜ AlertDTO

Note: AdminDashboardResponse.java already exists ✅
```

---

### Week 4: Business Services

**Days 1-2:**
```
⬜ PaymentService — calculateWeeklyPayment() logic
   Note: MQTT pipeline creates Invoices but never creates
         Payment records — this gap must be fixed here

⬜ InvoiceService
   - createInvoice() receives MeasurementDTO
   - Fraud detection (TDS critical = fraud_suspected)
   - Spoilage detection (pH critical = spoilage_detected)
   - Create Alert if issues

⬜ DashboardService
   - getFarmerDashboard(farmer_id)
   - getCenterDashboard(center_id)
   - getCompanyDashboard(company_id)

Note: AdminDashboardService.java already exists ✅
      MqttMeasurementService.java already exists ✅
```

---

### Week 4: Validation & Error Handling

**Days 3-5:**
```
⬜ Add @Valid annotations to all DTOs
⬜ GlobalExceptionHandler.java:
  - 400 Bad Request (invalid input)
  - 401 Unauthorized (no JWT)
  - 403 Forbidden (wrong role)
  - 404 Not Found
  - 500 Internal Server Error
⬜ Test all error scenarios with Postman
```

---

### **Backend Phase 2 Deliverable:**
⬜ Spring Security + JWT working  
⬜ 10 REST controllers working  
⬜ 30+ endpoints tested with Postman  
⬜ All DTOs created  
⬜ Error handling in place  
⬜ Payment record creation logic implemented  

---

## 🔌 Firmware Developer Tasks

### Week 3: WiFi & Basic Connectivity

**Days 1-3:**
```
□ Implement WiFi connection
□ Handle disconnection gracefully
□ Display WiFi status on LCD
```

---

### Week 3-4: MQTT Implementation

**Days 4-7:**
```
□ Confirm MQTT payload format with Backend Dev:
  {
    "farmer_id": 1,
    "device_id": 5,
    "collection_center_id": 2,
    "measurement_datetime": "2026-03-09T14:30:00",
    "drc": 45.67,
    "total_litres": 10.5,
    "temperature": 29.2,
    "ph_status": "normal",
    "tds_status": "warning"
  }

□ Implement MQTT client
□ Topic: device/{device_id}/measurement
□ Serialize to JSON + send via MQTT
```

---

### Week 4: Offline Sync Logic

**Days 1-3:**
```
□ Implement offline queuing (store in EEPROM)
□ Handle WiFi reconnection
□ Test offline scenario end-to-end
```

---

### **Firmware Week 3-4 Deliverable:**
□ WiFi connecting reliably  
□ MQTT payload confirmed with Backend  
□ Device sends measurements via MQTT  
□ Offline queuing works  
□ Sync logic implemented  

---

## 🎨 Frontend Developer Tasks

### Week 3: Component Building

**Days 1-3:**
```
□ Build Login Component
□ Build Farmer Dashboard
□ Build Collection Center Dashboard
□ Build Company Admin Dashboard
```

---

### Week 3-4: Styling & Responsiveness

**Days 4-7:**
```
□ Apply Tailwind CSS to all pages
□ Make responsive (mobile / tablet / desktop)
```

---

### Week 4: Mock Data & State Management

**Days 1-5:**
```
□ Create mock API responses (mockData.js)
□ Implement Redux (auth slice, data slice, ui slice)
□ Implement role-based routing
□ Implement login/logout flow
```

---

### **Frontend Week 3-4 Deliverable:**
□ Login page works (with mock data)  
□ All dashboard pages built  
□ Styled with Tailwind CSS  
□ Responsive design  
□ Redux working  
□ Protected routes working  
□ Role-based navigation working  

---

---

# 🔌 PHASE 3: INTEGRATION (Weeks 5-6)

## Backend Developer Tasks

### Week 5: MQTT Consumer — ✅ ALREADY DONE

```
✅ MqttConfig.java — connects to Mosquitto, subscribes to topics
✅ MqttMeasurementService.java — receives JSON, creates Invoice + Alert
✅ Auto-creates Device if none exists for center
✅ Fraud/spoilage alert generation

Remaining gaps to fix:
⬜ Payment records not created by MQTT pipeline (fix in PaymentService)
⬜ No deduplication of duplicate MQTT messages
⬜ No sensor value range validation
```

---

### Week 5: MQTT Testing with Firmware

**Day 5:**
```
□ Sync with Firmware Dev — confirm payload format matches
□ Test: mosquitto_pub → Backend processes → invoice created in DB
□ Fix any payload mismatches together
```

---

### Week 6: Business Logic & Optimization

**Days 1-5:**
```
⬜ Implement weekly payment calculation trigger
⬜ Optimize dashboard queries (<100ms response time)
⬜ Test end-to-end: device → MQTT → invoice → payment → dashboard
```

---

### **Backend Phase 3 Deliverable:**
✅ MQTT consumer receiving device data  
✅ Device data being created as invoices  
✅ Alert generation working  
⬜ Payment calculation trigger  
⬜ Dashboard queries optimized  
⬜ End-to-end flow fully tested  

---

## 🔌 Firmware Developer Tasks

### Week 5-6: Device-to-Backend Testing

```
□ Device sends real measurement via MQTT
□ Verify data in database (SELECT * FROM invoice)
□ Test offline → online sync flow
□ Debug any payload format mismatches with Backend Dev
□ Test error scenarios (MQTT broker down, WiFi unstable)
```

---

### **Firmware Phase 3 Deliverable:**
□ Device ↔ Backend MQTT working  
□ Real measurements sending to Backend  
□ Offline queuing and sync verified  
□ Integration confirmed with Backend  

---

## 🎨 Frontend Developer Tasks

### Week 5-6: API Integration

```
□ Replace mock data with real Backend APIs
□ Implement JWT token handling
□ Test login flow end-to-end
□ Add loading states and error handling
□ Implement real-time updates (polling or WebSocket)
```

---

### **Frontend Phase 3 Deliverable:**
□ Real API integration working  
□ JWT authentication working  
□ Dashboards show real data  
□ Error handling in place  
□ Real-time updates working  

---

---

# ✅ PHASE 4: TESTING & LAUNCH (Weeks 7-8)

## Backend Developer Tasks

### Week 7: Unit & Integration Tests

```
⬜ Unit tests for UserService, InvoiceService, PaymentService, AlertService
⬜ Integration test: full flow (login → MQTT → invoice → dashboard)
⬜ Target: >80% code coverage
⬜ mvn test → all pass
```

---

### Week 7-8: Performance & Load Testing

```
⬜ Load test with 1000 invoices
⬜ Verify response time <100ms for dashboard queries
⬜ Test API throughput (100 req/s)
```

---

### Week 8: Documentation & Deployment

```
⬜ Add springdoc-openapi to pom.xml (Swagger UI)
⬜ Verify all endpoints documented at /swagger-ui.html
⬜ Write README.md
⬜ Docker setup (optional)
⬜ mvn clean package → JAR ready for deployment
```

---

### **Backend Phase 4 Deliverable:**
⬜ All unit tests passing  
⬜ Integration tests passing  
⬜ Load tests passing  
⬜ API documented (Swagger)  
⬜ README complete  
⬜ JAR package ready  

---

## 🔌 Firmware Developer Tasks

### Week 7-8: Device Testing & Calibration

```
□ Test with real/simulated latex samples
□ Verify DRC accuracy ±1%
□ Battery testing (estimate battery life)
□ Create calibration procedure
□ Write user manual
□ Tag firmware: git tag v1.0.0
```

---

### **Firmware Phase 4 Deliverable:**
□ Device tested and validated  
□ Accuracy verified (±1% DRC)  
□ Reliability tested (100+ cycles)  
□ Calibration procedure written  
□ User manual complete  
□ Firmware tagged and ready  

---

## 🎨 Frontend Developer Tasks

### Week 7-8: Polish & Deployment

```
□ Manual testing of all flows
□ Performance optimization (bundle size, lazy loading)
□ UI polish (loading spinners, error messages, responsive)
□ Write README.md
□ Deploy to Netlify / Vercel / AWS S3
□ Final checks (no console errors, all links working)
```

---

### **Frontend Phase 4 Deliverable:**
□ All manual tests passing  
□ Performance optimized  
□ Mobile responsive verified  
□ README complete  
□ Deployed and live  

---

---

## 🎉 FINAL DELIVERABLES (Week 8 End)

**Backend:**
- ✅ MQTT pipeline receiving device data
- ✅ PostgreSQL database with data
- ⬜ All APIs working
- ⬜ Spring Security + JWT
- ⬜ Tests passing
- ⬜ Documentation complete
- ⬜ Ready for production deployment

**Firmware:**
- ⬜ ESP32 measuring accurately
- ⬜ Sending data via MQTT
- ⬜ Offline capable
- ⬜ User manual complete
- ⬜ Calibration procedure documented
- ⬜ Battery life tested
- ⬜ Ready for field deployment

**Frontend:**
- ⬜ React dashboard deployed
- ⬜ All user roles working
- ⬜ Real-time data showing
- ⬜ Mobile responsive
- ⬜ Error handling complete
- ⬜ Documentation done
- ⬜ Live and accessible

---

## 📊 ROLE SUMMARY

| Task | Backend | Firmware | Frontend |
|------|---------|----------|----------|
| Database | ✅ Done | | |
| Entities | ✅ Done | | |
| Repositories | ✅ Done | | |
| MQTT Consumer | ✅ Done | | |
| Admin Dashboard | ✅ Done | | |
| Spring Security | ⬜ Next | | |
| Business Services | ⬜ Next | | |
| CRUD APIs | ⬜ Next | | |
| Sensors | | ⬜ | |
| WiFi/MQTT Client | | ⬜ | |
| Offline Storage | | ⬜ | |
| React Components | | | ⬜ |
| Dashboards | | | ⬜ |
| API Integration | | | ⬜ |
| Testing | ⬜ | ⬜ | ⬜ |
| Documentation | ⬜ | ⬜ | ⬜ |
| Deployment | ⬜ | ⬜ | ⬜ |

---

## 📍 Current Position Summary

**Backend is ahead of schedule.** MQTT pipeline and admin dashboard were completed early (normally Phase 3 work). Foundation layer is 100% done.

**Immediate next step → Spring Security + JWT** (Phase 2, Week 3).

**Last updated:** April 2026