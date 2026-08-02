# Smart-Metrolac Frontend Roadmap
**Last Updated:** April 2026

---

## Phase 1: Project Setup ✅ COMPLETE

- ✅ Create React project with Vite
- ✅ Install dependencies (Redux Toolkit, React Router, Axios, Tailwind, jwt-decode)
- ✅ Configure Tailwind CSS
- ✅ Create folder structure (api/, app/, features/, components/, pages/, routes/, utils/)
- ✅ Verify project runs

---

## Phase 2: Core Infrastructure ✅ COMPLETE

- ✅ Configure Redux store (app/store.js)
- ✅ Create authSlice (token, role, user info)
- ✅ Create Axios client with interceptors (api/axiosClient.js)
- ✅ Create authApi.js (login, change password, reset password)
- ✅ Set up React Router base configuration
- ✅ Create <ProtectedRoute> component with role checking
- ✅ Wire loadAuthFromStorage on app startup

---

## Phase 3: Authentication Pages ✅ COMPLETE

- ✅ Login page (UI + Redux integration + API call)
- ✅ Role-based redirect after login
- ✅ Change Password page (accessible via sidebar — manual navigation)
- ✅ Logout functionality (useLogout hook + sidebar button)
- ✅ Test all 3 role logins
- ⏸️ SKIPPED: Forced password change on first login
  - Reason: JWT must_change_password claim returning incorrect value
  - Status: must_change_password exists in DB and JWT, but value unreliable
  - Deferred to: Phase 7 Polish

---

## Phase 4: Company Admin Module ✅ COMPLETE

- ✅ AdminLayout (sidebar + topbar + content area)
- ✅ Company Admin Dashboard (KPI cards + bar chart + latest alerts)
- ✅ Rubber Price Management page (view + update price)
- ✅ All Alerts read-only view (All + Unresolved filter)

---

## Phase 5: CC Admin + Farmer Module ✅ COMPLETE

- ✅ CenterLayout (sidebar + topbar + content area)
- ✅ Farmer Management (list, add, edit, delete, reset password)
- ✅ Invoice List + filters (date range, week/year)
- ✅ Payment List + recalculate button
- ✅ Alert Management page (All + Unresolved filter)
- ✅ FarmerLayout (sidebar + topbar + content area)
- ✅ Farmer Payment History (list + week/year filter + total earnings)
- ⏸️ SKIPPED: Alert resolve button
  - Reason: userId not available in JWT token reliably
  - resolveAlert() function exists in alertApi.js — ready to wire
  - Deferred to: Phase 7 Polish
- ⏸️ SKIPPED: Manual invoice creation form
  - Reason: Not yet built — deprioritized for time
  - Deferred to: Phase 7 Polish
- ⏸️ SKIPPED: CC Admin Dashboard (center-specific KPIs)
  - Reason: /center/dashboard still shows placeholder
  - Deferred to: Phase 7 Polish
- ⏸️ SKIPPED: farmerCode shown alongside farmer name in payments
  - Reason: farmerCode not returned in payments API response
  - Deferred to: Phase 7 Polish

---

## Phase 6: Polish & Testing ⏳ IN PROGRESS

### Functional Testing
- [ ] Company Admin — Dashboard, Price Management, Alerts
- [ ] CC Admin — Farmers, Invoices, Payments, Alerts
- [ ] Farmer — Payment History, Filters
- [ ] Cross-role access (wrong role can't access other dashboards)

### UI Polish
- [ ] Reusable components (StatusBadge, DataTable)
- [ ] Loading spinners on all pages
- [ ] Toast notifications for success/error messages
- [ ] Empty states on all tables
- [ ] Form validation messages
- [ ] Responsive design check

### Deferred Items (from Phase 3-5)
- [ ] Forced password change on first login
- [ ] Alert resolve button (needs userId in JWT)
- [ ] Manual invoice creation form
- [ ] CC Admin Dashboard page
- [ ] farmerCode in payments table

---

## Phase 7: Pre-Deployment ⏳ PENDING

- [ ] Environment variable setup (API base URL)
- [ ] Remove TestController.java from backend ⚠️
- [ ] Build production bundle (npm run build)
- [ ] Final integration test with backend
- [ ] Update BACKEND_GUIDE.md with firmware MQTT note