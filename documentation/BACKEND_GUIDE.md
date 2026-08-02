# Smart-Metrolac Backend — Integration Guide

A quick reference for frontend and firmware developers to connect with the backend.

---

## 🚀 Running the Backend

### Prerequisites
- Java 21
- Maven
- PostgreSQL 17
- Mosquitto MQTT broker (for firmware integration)

### Setup Steps

**1. Clone the repo and navigate to the backend:**
```bash
cd code/backend
```

**2. Create the PostgreSQL database:**
- Open pgAdmin 4
- Create a database named `smart_metrolac`
- Run the SQL in `DATABASE_SETUP.txt` (Section 3 for schema, Section 4 for mock data)

**3. Configure credentials:**
Open `src/main/resources/application.properties` and update:
```
spring.datasource.username=postgres
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```

**4. Run the backend:**
```bash
mvn spring-boot:run
```

The server starts on **`http://localhost:8080`**.

---

## 🔐 Authentication

Every API request (except login) requires a JWT token in the header:
```
Authorization: Bearer <token>
```

### Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
    "username": "M0001",
    "password": "password123"
}
```

**Response:**
```json
{
    "token": "eyJhbGciOiJIUzM4NCJ9..."
}
```

Tokens expire after 24 hours.

### Default Credentials (mock data)

| Username | Password | Role |
|----------|----------|------|
| A0001 | password123 | company_admin |
| M0001 | password123 | collection_center_admin |
| F0001 | password123 | farmer |
| F0002 | password123 | farmer |

### Username Format

| Role | Format | Example |
|------|--------|---------|
| Company Admin | A#### | A0001 |
| Collection Center Admin | M#### | M0001 |
| Farmer | F#### | F0001 |

### Default Password for New Farmers

When a new farmer is registered, a login account is auto-created with default password `00000000`. They must change it on first login.

---

## 📡 API Endpoints (Frontend)

### 🧑‍🌾 Farmers

| Method | URL | Roles |
|--------|-----|-------|
| GET | `/api/farmers?centerId=1` | company_admin, collection_center_admin |
| GET | `/api/farmers/{id}` | company_admin, collection_center_admin |
| POST | `/api/farmers` | collection_center_admin |
| PUT | `/api/farmers/{id}` | collection_center_admin |
| DELETE | `/api/farmers/{id}` | collection_center_admin |

**POST body:**
```json
{
    "name": "Kamal Silva",
    "address": "Village Road 3, Kalutara",
    "phoneNumber": "+94-77-3333333",
    "collectionCenterId": 1
}
```

### 📄 Invoices

| Method | URL | Roles |
|--------|-----|-------|
| GET | `/api/invoices?centerId=1` | company_admin, collection_center_admin |
| GET | `/api/invoices?centerId=1&start=...&end=...` | (date range filter) |
| GET | `/api/invoices?centerId=1&week=16&year=2026` | (week filter) |
| GET | `/api/invoices/{id}` | company_admin, collection_center_admin |
| POST | `/api/invoices` | collection_center_admin |

**POST body:**
```json
{
    "farmerId": 1,
    "deviceId": 1,
    "centerId": 1,
    "measurementDateTime": "2026-04-18T10:00:00",
    "drc": 35.50,
    "totalLitres": 10.00,
    "totalAmount": 2500.00,
    "temperature": 27.00,
    "phStatus": "normal",
    "tdsStatus": "normal"
}
```

Creating an invoice automatically updates the weekly payment for that farmer.

### 💰 Payments

| Method | URL | Roles |
|--------|-----|-------|
| GET | `/api/payments?farmerId=1` | farmer, collection_center_admin, company_admin |
| GET | `/api/payments?farmerId=1&week=16&year=2026` | same |
| GET | `/api/payments?centerId=1` | collection_center_admin, company_admin |
| POST | `/api/payments/calculate?farmerId=1&week=16&year=2026` | collection_center_admin |

### 🚨 Alerts

| Method | URL | Roles |
|--------|-----|-------|
| GET | `/api/alerts?centerId=1` | collection_center_admin, company_admin |
| GET | `/api/alerts/unresolved?centerId=1` | collection_center_admin, company_admin |
| PUT | `/api/alerts/{id}/resolve?resolvedByUserId=2` | collection_center_admin |

### 👤 Users

| Method | URL | Roles |
|--------|-----|-------|
| PUT | `/api/users/change-password` | any authenticated user |
| PUT | `/api/users/{id}/reset-password` | collection_center_admin |

**Change password body:**
```json
{
    "currentPassword": "oldpassword",
    "newPassword": "newpassword"
}
```

### 📊 Admin Dashboard

| Method | URL | Roles |
|--------|-----|-------|
| GET | `/api/admin/dashboard` | company_admin |

---

## 📡 MQTT Integration (Firmware)

### Broker
```
tcp://localhost:1883
```

### Topic
```
smartmetrolac/device01/telemetry
```

### Payload Format (JSON)

```json
{
    "farmer_id": 1,
    "device_id": 1,
    "collection_center_id": 1,
    "measurement_datetime": "2026-04-18T10:00:00",
    "drc": 35.50,
    "total_litres": 10.00,
    "total_amount": 2500.00,
    "temperature": 27.00,
    "ph_status": "normal",
    "tds_status": "normal"
}
```

### Accepted Field Name Aliases

The backend accepts multiple formats — use whichever is easier:
- `farmer_id` or `farmerId` or `f_id`
- `device_id` or `deviceId` or `d_id`
- `collection_center_id` or `collectionCenterId` or `cc_id`

### Status Values

- `ph_status`: `"normal"`, `"warning"`, `"critical"`
- `tds_status`: `"normal"`, `"warning"`, `"critical"`

### What Happens After MQTT Message Is Received

1. Invoice record created in the database
2. If `ph_status` is `critical` → spoilage alert created
3. If `tds_status` is `critical` → fraud alert created
4. Device is auto-registered if not already in the database

---

## ⚠️ Error Responses

All errors return a consistent JSON format:

```json
{
    "status": 404,
    "error": "Farmer not found"
}
```

### Common HTTP Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad input (validation failed) |
| 401 | Not logged in / invalid token |
| 403 | Wrong role / access denied |
| 404 | Resource not found |
| 500 | Server error |

---

## 🧪 Testing

Use **Postman** to test endpoints.

1. Log in to get a token
2. Add header `Authorization: Bearer <token>` to every subsequent request
3. Test each endpoint

---

## 📬 Contact

For backend-related issues or questions, contact the backend developer.
