📌 Design Decision #1 — Folder Structure
Decision: Use feature-based folder structure with separated concerns.
src/
├── api/              ← Axios setup + API call functions
├── app/              ← Redux store configuration
├── features/         ← Redux slices (auth, farmers, invoices, etc.)
├── components/       ← Reusable UI components
├── pages/            ← Full page components
├── routes/           ← Route definitions + protected routes
├── utils/            ← Helper functions
└── App.jsx
Rationale: Separates UI, state, and API concerns. Scales cleanly as the app grows from 10 pages.

--------------------------------------------------------------

📌 Design Decision #2 — Auth Flow
Decision:

JWT stored in both localStorage (for refresh persistence) and Redux (for live state)
One <ProtectedRoute> component handles auth + role checking for all protected pages
After login, decode JWT to read role → redirect to role-specific dashboard
On 401 response from any API → clear auth + redirect to /login

Rationale: Centralizes auth logic, survives page refreshes, prevents URL-based access by wrong roles.

---------------------------------------------------------------

📌 Design Decision #3 — API Layer
Decision:

Two-layer API structure:

api/axiosClient.js — single configured Axios instance with base URL + interceptors
api/{domain}Api.js — one file per domain (farmers, invoices, payments, alerts, auth, users, price)


Request interceptor automatically attaches JWT token from localStorage to every request
Response interceptor automatically handles 401 → clears auth + redirects to /login
Pages never call Axios directly — they call domain API functions

Rationale: Centralizes URL, auth, and error handling. Pages stay clean. One place to change if backend URL or auth logic changes.

---------------------------------------------------------------

📌 Design Decision #4 — Build Tool
Decision: Use Vite to scaffold the React project (not Create React App).
Rationale: CRA is deprecated. Vite is the modern standard — faster dev server, faster builds, actively maintained.

---------------------------------------------------------------

📌 Design Decision #5 — Roadmap
Decision: Maintain a Frontend_Roadmap_Current.md file, organized by phases. Update it after each completed task.
Rationale: Mirrors the successful backend roadmap pattern. Provides progress visibility and serves as a recovery point if work pauses.

---------------------------------------------------------------

📌 Design Decision #6 — Frontend Dependencies
Decision: Use Redux Toolkit (not classic Redux), React Router DOM v6+, Axios for HTTP, jwt-decode for token parsing, Tailwind CSS for styling.
Rationale: Modern standard React stack. Redux Toolkit reduces boilerplate dramatically. Tailwind allows rapid UI building without writing custom CSS.

---------------------------------------------------------------

📌 Design Decision #7 — Tailwind Setup
Decision: Use Tailwind CSS v4 with the official Vite plugin (@tailwindcss/vite). No tailwind.config.js file needed.
Rationale: Tailwind v4 auto-detects content. Simpler setup, fewer files to maintain.

---------------------------------------------------------------

📌 Design Decision #8 — Redux Store Location
Decision: Place the Redux store at src/app/store.js. Wrap the app with <Provider> in src/main.jsx.
Rationale: Standard Redux Toolkit convention. app/ folder is reserved for top-level app config (store, providers).

---------------------------------------------------------------

📌 Design Decision #9 — Auth State Shape
Decision: The auth slice stores three fields: token (string | null), user (object | null with username + role), isAuthenticated (boolean).
Rationale: Minimal state needed by the entire app. isAuthenticated is derived but cached as a boolean for clean conditional checks in components.

-----------------------------------------------------------

📌 Design Decision #10 — 401 Handling StrategyDecision: On 401 response, axios interceptor will: (1) clear smartmetrolac_token from localStorage, (2) redirect via window.location.href = '/login' — a hard redirect rather than React Router navigation.
Rationale: Avoids tight coupling between API client and React. Hard redirect ensures no leftover in-memory state after auth failure.

----------------------------------------------------------

📌 Design Decision #10 — 401 Handling Strategy
Decision: On 401 response, axios interceptor will: (1) clear smartmetrolac_token from localStorage, (2) redirect via window.location.href = '/login' — a hard redirect rather than React Router navigation.
Rationale: Avoids tight coupling between API client and React. Hard redirect ensures no leftover in-memory state after auth failure.

----------------------------------------------------------

📌 Design Decision #11 — Final Theme
Decision: Agrinex-inspired theme (Option A)

Primary: #2A5C3F (deep forest green)
Primary Light: #3D8A5E
Primary Lighter: #EAF3EE (active nav bg)
Accent: #C8891A (warm amber — rubber price)
Background: #F5F6F2 (soft off-white)
Surface: #FFFFFF (cards, tables)
Text: #1A1A1A / Muted: #6B7280
Border: #E2E4DC
Status normal: #16A34A / warning: #D97706 / critical: #DC2626 / info: #2563EB
Font: Inter (Google Fonts)

----------------------------------------------------------

📌 Design Decision #12 — Route Structure
Decision: All routes defined upfront in src/routes/AppRoutes.jsx. Protected routes use a single <ProtectedRoute allowedRoles={[]}> wrapper. Unauthorized access redirects to /unauthorized page. Unauthenticated access redirects to /login.
Rationale: Centralizes all routing in one file. Role checking in one component prevents duplication across pages.

---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------
---------------------------------------------------------


