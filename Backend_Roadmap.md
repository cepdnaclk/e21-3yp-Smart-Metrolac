# SMART-METROLAC: BACKEND ROADMAP
**Last Updated:** April 2026 — Backend Developer View Only

---

## 📍 CURRENT POSITION
> **Phase 2 — Core Implementation**
> Spring Security + JWT ✅ just completed
> Next: Business Services + CRUD Controllers

---

## ✅ PHASE 1: FOUNDATION — COMPLETE

| Task | Status |
|------|--------|
| PostgreSQL database created + schema applied | ✅ Done |
| Mock data inserted | ✅ Done |
| 8 JPA entities | ✅ Done |
| 8 repositories | ✅ Done |
| MQTT ingestion pipeline | ✅ Done |
| Admin dashboard service + controller | ✅ Done |

---

## ✅ PHASE 2A: SECURITY — COMPLETE

| Task | Status |
|------|--------|
| `spring-boot-starter-security` added to pom.xml | ✅ Done |
| `jjwt` 0.12.6 added to pom.xml | ✅ Done |
| `JwtUtil.java` — generates + validates tokens | ✅ Done |
| `JwtAuthFilter.java` — reads token from request header | ✅ Done |
| `SecurityConfig.java` — security rules + filter chain | ✅ Done |
| `CustomUserDetailsService.java` — loads user from DB | ✅ Done |
| `UserRepository.findByUsername()` — added | ✅ Done |
| `LoginRequest.java` DTO | ✅ Done |
| `AuthController.java` — POST /api/auth/login | ✅ Done |
| Login tested in Postman — returns JWT token | ✅ Done |
| Passwords BCrypt hashed in database | ✅ Done |

---

## 🔜 PHASE 2B: BUSINESS SERVICES — NEXT

### Step 1: FarmerService + FarmerController
```
⬜ FarmerService.java
   - getAllFarmersByCenter(centerId)
   - getFarmerById(id)
   - createFarmer(dto)
   - updateFarmer(id, dto)
   - deleteFarmer(id)

⬜ FarmerController.java
   - GET    /api/farmers?centerId=1
   - GET    /api/farmers/{id}
   - POST   /api/farmers
   - PUT    /api/farmers/{id}
   - DELETE /api/farmers/{id}
```

### Step 2: InvoiceService + InvoiceController
```
⬜ InvoiceService.java
   - getInvoicesByFarmer(farmerId)
   - getInvoicesByCenter(centerId)
   - getInvoiceById(id)

⬜ InvoiceController.java
   - GET /api/invoices?farmerId=1
   - GET /api/invoices?centerId=1
   - GET /api/invoices/{id}
```

### Step 3: PaymentService + PaymentController
```
⬜ PaymentService.java
   - getPaymentsByFarmer(farmerId)
   - calculateAndSaveWeeklyPayment(farmerId, week, year)
   ⚠️ MQTT pipeline creates invoices but never creates
      Payment records — this gap must be fixed here

⬜ PaymentController.java
   - GET  /api/payments?farmerId=1
   - POST /api/payments/calculate
```

### Step 4: AlertService + AlertController
```
⬜ AlertService.java
   - getUnresolvedAlerts(centerId)
   - resolveAlert(alertId, resolvedByUserId)

⬜ AlertController.java
   - GET /api/alerts/unresolved?centerId=1
   - PUT /api/alerts/{id}/resolve
```

---

## ⬜ PHASE 2C: HARDENING

```
⬜ GlobalExceptionHandler.java
   - 400 Bad Request
   - 401 Unauthorized
   - 403 Forbidden
   - 404 Not Found
   - 500 Internal Server Error

⬜ Input validation (@Valid on all DTOs)
⬜ Remove TestController.java (placeholder, not needed)
```

---

## ⬜ PHASE 3: INTEGRATION

```
⬜ Fix Payment record creation in MQTT pipeline
⬜ Test full flow: device → MQTT → invoice → payment → dashboard
⬜ Optimize dashboard queries (<100ms)
⬜ Sync MQTT payload format with firmware team
```

---

## ⬜ PHASE 4: TESTING & LAUNCH

```
⬜ Unit tests (InvoiceService, PaymentService, AlertService)
⬜ Integration tests (full login → data flow)
⬜ Add Swagger (springdoc-openapi)
⬜ Write README.md
⬜ mvn clean package → JAR ready
```

---

## 📊 QUICK STATUS TABLE

| Component | Status |
|-----------|--------|
| Database + Schema | ✅ Done |
| JPA Entities (8) | ✅ Done |
| Repositories (8) | ✅ Done |
| MQTT Pipeline | ✅ Done |
| Admin Dashboard | ✅ Done |
| Spring Security + JWT | ✅ Done |
| Login endpoint | ✅ Done |
| FarmerService + Controller | ⬜ Next |
| InvoiceService + Controller | ⬜ Next |
| PaymentService + Controller | ⬜ Next |
| AlertService + Controller | ⬜ Next |
| Global Exception Handler | ⬜ Pending |
| Input Validation | ⬜ Pending |
| Integration Testing | ⬜ Pending |
| Swagger Docs | ⬜ Pending |
| Deployment | ⬜ Pending |