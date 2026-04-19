# SMART-METROLAC: BACKEND ROADMAP
**Last Updated:** April 18, 2026 — Backend Developer View Only

---

## 📍 CURRENT POSITION
> **Phase 2B — Business Services**
> FarmerService ✅ InvoiceService ✅ PaymentService ✅
> Next: AlertService + AlertController

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
| `spring-boot-starter-security` + `jjwt` added to pom.xml | ✅ Done |
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

## 🔄 PHASE 2B: BUSINESS SERVICES — IN PROGRESS

### Step 1: FarmerService + FarmerController ✅ DONE
```
✅ FarmerService.java
   - getAllFarmersByCenter(centerId)
   - getFarmerById(id)
   - createFarmer() — auto creates User account (F0001, F0002...)
   - updateFarmer(id)
   - deleteFarmer(id)

✅ FarmerController.java
   - GET    /api/farmers?centerId=1
   - GET    /api/farmers/{id}
   - POST   /api/farmers
   - PUT    /api/farmers/{id}
   - DELETE /api/farmers/{id}

✅ FarmerResponse.java — clean DTO, no sensitive data exposed
✅ Auto user creation with default password 00000000
✅ must_change_password = true on creation
✅ Username format: F0001, F0002...
```

### Step 2: InvoiceService + InvoiceController ✅ DONE
```
✅ InvoiceService.java
   - getInvoicesByCenter(centerId)
   - getInvoicesByCenterAndDateRange(centerId, start, end)
   - getInvoicesByCenterAndWeek(centerId, week, year)
   - getInvoiceById(id)
   - createInvoice() — also auto-triggers payment calculation

✅ InvoiceController.java
   - GET /api/invoices?centerId=1
   - GET /api/invoices?centerId=1&start=...&end=...
   - GET /api/invoices?centerId=1&week=16&year=2026
   - GET /api/invoices/{id}
   - POST /api/invoices

✅ InvoiceResponse.java — clean DTO
```

### Step 3: PaymentService + PaymentController ✅ DONE
```
✅ PaymentService.java
   - calculateAndSaveWeeklyPayment(farmerId, week, year)
   - getPaymentsByFarmer(farmerId)
   - getPaymentByFarmerAndWeek(farmerId, week, year)
   - getPaymentsByCenter(centerId)

✅ PaymentController.java
   - GET  /api/payments?farmerId=1
   - GET  /api/payments?farmerId=1&week=16&year=2026
   - GET  /api/payments?centerId=1
   - POST /api/payments/calculate?farmerId=1&week=16&year=2026

✅ PaymentResponse.java — clean DTO
✅ Auto-calculation fixed — payment updates when invoice is created
```

### Step 4: AlertService + AlertController 🔜 NEXT
```
⬜ AlertService.java
   - getUnresolvedAlerts(centerId)
   - getAllAlerts(centerId)
   - resolveAlert(alertId, resolvedByUserId)

⬜ AlertController.java
   - GET /api/alerts?centerId=1
   - GET /api/alerts/unresolved?centerId=1
   - PUT /api/alerts/{id}/resolve

⬜ AlertResponse.java — clean DTO
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
⬜ UserService — change password + admin reset to 00000000
```

---

## ⬜ PHASE 3: INTEGRATION

```
⬜ Test full flow: device → MQTT → invoice → payment → dashboard
⬜ Optimize dashboard queries (<100ms)
⬜ Sync MQTT payload format with firmware team
⬜ Fix MQTT pipeline to also trigger payment calculation
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
| FarmerService + Controller | ✅ Done |
| InvoiceService + Controller | ✅ Done |
| PaymentService + Controller | ✅ Done |
| AlertService + Controller | 🔜 Next |
| UserService (password change) | ⬜ Pending |
| Global Exception Handler | ⬜ Pending |
| Input Validation | ⬜ Pending |
| Integration Testing | ⬜ Pending |
| Swagger Docs | ⬜ Pending |
| Deployment | ⬜ Pending |