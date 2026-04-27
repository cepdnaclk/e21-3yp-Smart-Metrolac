import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import ChangePasswordPage from '../pages/ChangePasswordPage'
import AdminLayout from '../components/layouts/AdminLayout'
import CenterLayout from '../components/layouts/CenterLayout'
import FarmerLayout from '../components/layouts/FarmerLayout'
import CompanyAdminDashboard from '../pages/admin/CompanyAdminDashboard'
import RubberPricePage from '../pages/admin/RubberPricePage'
import AdminAlertsPage from '../pages/admin/AdminAlertsPage'
import FarmerManagementPage from '../pages/center/FarmerManagementPage'
import InvoiceListPage from '../pages/center/InvoiceListPage'
import PaymentListPage from '../pages/center/PaymentListPage'
import AlertManagementPage from '../pages/center/AlertManagementPage'

// ── Placeholder pages (will be replaced with real components later) ──────────
const Unauthorized     = () => <div>Access Denied</div>
const CenterDashboard  = () => <div>Center Dashboard - Coming Soon</div>
const FarmerPayments   = () => <div>Farmer Payments - Coming Soon</div>

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ──────────────────────────────────────────────── */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ── Default redirect ───────────────────────────────────────────── */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* ── Any authenticated user ─────────────────────────────────────── */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        {/* ── Company admin routes ───────────────────────────────────────── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <AdminLayout><CompanyAdminDashboard /></AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/price"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <AdminLayout><RubberPricePage /></AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/alerts"
          element={
            <ProtectedRoute allowedRoles={['company_admin']}>
              <AdminLayout><AdminAlertsPage /></AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Collection center admin routes ─────────────────────────────── */}
        <Route
          path="/center/dashboard"
          element={
            <ProtectedRoute allowedRoles={['collection_center_admin']}>
              <CenterLayout><CenterDashboard /></CenterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/center/farmers"
          element={
            <ProtectedRoute allowedRoles={['collection_center_admin']}>
              <CenterLayout><FarmerManagementPage /></CenterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/center/invoices"
          element={
            <ProtectedRoute allowedRoles={['collection_center_admin']}>
              <CenterLayout><InvoiceListPage /></CenterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/center/payments"
          element={
            <ProtectedRoute allowedRoles={['collection_center_admin']}>
              <CenterLayout><PaymentListPage /></CenterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/center/alerts"
          element={
            <ProtectedRoute allowedRoles={['collection_center_admin']}>
              <CenterLayout><AlertManagementPage /></CenterLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Farmer routes ──────────────────────────────────────────────── */}
        <Route
          path="/farmer/payments"
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerLayout><FarmerPayments /></FarmerLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
