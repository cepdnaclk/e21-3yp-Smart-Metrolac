📋 Suggested Frontend Roadmap
Phase 1: Project Setup

 ✅Create React project with Vite
 ✅Install dependencies (Redux Toolkit, React Router, Axios, Tailwind, jwt-decode)
 ✅Configure Tailwind CSS
 ✅Create folder structure (api/, app/, features/, components/, pages/, routes/, utils/)
 ✅Verify project runs

Phase 2: Core Infrastructure

 ✅Configure Redux store (app/store.js)
 ✅Create authSlice (token, role, user info)
 ✅Create Axios client with interceptors (api/axiosClient.js)
 ✅Create authApi.js (login, change password)
 ✅Set up React Router base configuration
 ✅Create <ProtectedRoute> component with role checking

Phase 3: Authentication Pages

 ✅Login page (UI + Redux integration + API call)
 ✅Role-based redirect after login
 ⏸️Change Password page (forced on first login)
 ✅Logout functionality
 ✅Test all 3 role logins

Phase 4: Company Admin Module

 ✅Company Admin Dashboard layout
 ✅KPI cards (total centers, total farmers)
 ✅Monthly litres bar chart
 ✅Latest alerts list
 ✅Rubber Price Management page (⚠️ backend endpoint pending)
 ✅All Alerts read-only view

Phase 5: Collection Center Admin Module

 CC Admin Dashboard layout + navigation
 Farmer Management (list, add, edit, delete)
 Farmer password reset
 Invoice list + filters (date range, week/year)
 Manual invoice creation
 Payment list + recalculate
 Alert management + resolve

Phase 6: Farmer Module

 Farmer Dashboard layout
 Payment history list
 Filter by week/year

Phase 7: Polish & Testing

 Reusable components (StatusBadge, DataTable, Modal, ConfirmDialog)
 Loading states (spinners, skeletons)
 Error handling (toast notifications)
 Empty states
 Form validation messages
 Responsive design check (mobile/tablet)
 Cross-role testing (verify role-based access actually works)

Phase 8: Pre-Deployment

 Environment variable setup (API base URL)
 Build production bundle (npm run build)
 Final integration test with backend