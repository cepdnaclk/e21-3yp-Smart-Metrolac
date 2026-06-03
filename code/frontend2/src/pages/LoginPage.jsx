import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Navigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { loginApi } from '../api/authApi'
import { loginSuccess } from '../features/auth/authSlice'

// Maps a role string to the correct landing page after login.
function getDashboardRoute(role) {
  switch (role) {
    case 'company_admin':           return '/admin/dashboard'
    case 'collection_center_admin': return '/center/dashboard'
    case 'farmer':                  return '/farmer/payments'
    default:                        return '/login'
  }
}

function LoginPage() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // If already logged in, skip the login page and go straight to the dashboard.
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Call the backend; on success it returns { token: '...' }
      const data = await loginApi(username, password)

      // Store the token in Redux (and localStorage via the slice).
      dispatch(loginSuccess({ token: data.token }))

      const decoded = jwtDecode(data.token)
      navigate(getDashboardRoute(decoded.role))
    } catch {
      setError('Invalid username or password.')
    } finally {
      // Always clear the loading spinner, whether the request succeeded or failed.
      setLoading(false)
    }
  }

  // ── Styles (CSS variables from index.css) ──────────────────────────────────
  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg)',
    fontFamily: 'var(--font-sans)',
  }

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  }

  const headingStyle = {
    color: 'var(--color-primary)',
    fontSize: '1.75rem',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '0.25rem',
  }

  const subheadingStyle = {
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '2rem',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text)',
    marginBottom: '0.375rem',
  }

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    color: 'var(--color-text)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '1.25rem',
  }

  const passwordWrapStyle = {
    position: 'relative',
    marginBottom: '1.25rem',
  }

  // The password input loses its own bottom margin — the wrapper provides it.
  const passwordInputStyle = {
    ...inputStyle,
    marginBottom: 0,
    paddingRight: '2.75rem',  // leave room so text never slides under the toggle
  }

  const toggleBtnStyle = {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
  }

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: loading ? 'var(--color-primary-light)' : 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '0.5rem',
  }

  const errorStyle = {
    color: 'var(--color-danger)',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center',
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>Smart-Metrolac</h1>
        <p style={subheadingStyle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} noValidate>
          <label style={labelStyle} htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            style={inputStyle}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <label style={labelStyle} htmlFor="password">Password</label>
          <div style={passwordWrapStyle}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              style={passwordInputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              style={toggleBtnStyle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                // Eye-off icon — password is visible, click to hide
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                // Eye icon — password is hidden, click to show
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Show the error message only when a login attempt has failed. */}
          {error && <p style={errorStyle}>{error}</p>}

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
