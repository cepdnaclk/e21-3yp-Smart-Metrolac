  import { useSelector } from 'react-redux'
  import { Navigate } from 'react-router-dom'

  // Wraps any route that requires authentication (and optionally a specific role).
  // Usage: <ProtectedRoute allowedRoles={['company_admin']}><SomePage /></ProtectedRoute>
  function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, user } = useSelector((state) => state.auth)

    // Check 1: user must be logged in.
    // If not, redirect to /login. `replace` prevents the login page from
    // being pushed onto the history stack, so the back button won't loop.
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    // Check 2: if the route restricts by role, verify the user has one of them.
    // allowedRoles is optional — omitting it means any authenticated user can access.
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />
    }

    // All checks passed — render the intended page.
    return children
  }

  export default ProtectedRoute
