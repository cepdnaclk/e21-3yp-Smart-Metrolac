import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, Navigate } from 'react-router-dom'
import { changePasswordApi } from '../api/authApi'

// Same role → route mapping used in LoginPage.
function getDashboardRoute(role) {
  switch (role) {
    case 'company_admin':           return '/admin/dashboard'
    case 'collection_center_admin': return '/center/dashboard'
    case 'farmer':                  return '/farmer/payments'
    default:                        return '/login'
  }
}

// Inline SVG eye icons — same pattern as LoginPage.
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

function ChangePasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [currentPassword,  setCurrentPassword]  = useState('')
  const [newPassword,      setNewPassword]       = useState('')
  const [confirmPassword,  setConfirmPassword]   = useState('')

  // Independent show/hide state for each field.
  const [showCurrent,  setShowCurrent]  = useState(false)
  const [showNew,      setShowNew]      = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  // Per-field validation errors shown inline.
  const [errors,  setErrors]  = useState({})
  // API-level error (e.g. current password wrong).
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)

  // Guard: unauthenticated users should never reach this page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // ── Frontend validation ────────────────────────────────────────────────────
  function validate() {
    const next = {}

    if (!currentPassword) next.currentPassword = 'Current password is required.'
    if (!newPassword)     next.newPassword      = 'New password is required.'
    else if (newPassword.length < 6)
                          next.newPassword      = 'New password must be at least 6 characters.'
    if (!confirmPassword) next.confirmPassword  = 'Please confirm your new password.'
    else if (newPassword !== confirmPassword)
                          next.confirmPassword  = 'Passwords do not match.'

    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')

    // Run validation and abort if there are any errors.
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      await changePasswordApi(currentPassword, newPassword)
      // On success, redirect to the user's role-appropriate dashboard.
      navigate(getDashboardRoute(user.role))
    } catch {
      setApiError('Current password is incorrect.')
    } finally {
      setLoading(false)
    }
  }

  // ── Styles — mirrors LoginPage for visual consistency ──────────────────────
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

  const baseInputStyle = {
    width: '100%',
    padding: '0.625rem 2.75rem 0.625rem 0.75rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    color: 'var(--color-text)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const inputWrapStyle = {
    position: 'relative',
    marginBottom: '0.375rem',
  }

  const fieldGroupStyle = {
    marginBottom: '1.25rem',
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

  const fieldErrorStyle = {
    color: 'var(--color-danger)',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
  }

  const apiErrorStyle = {
    color: 'var(--color-danger)',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    textAlign: 'center',
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

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={headingStyle}>Change Password</h1>
        <p style={subheadingStyle}>Please set a new password to continue</p>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Current Password ──────────────────────────────────────────── */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="currentPassword">Current Password</label>
            <div style={inputWrapStyle}>
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                style={baseInputStyle}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={toggleBtnStyle}
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.currentPassword && <p style={fieldErrorStyle}>{errors.currentPassword}</p>}
          </div>

          {/* ── New Password ──────────────────────────────────────────────── */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="newPassword">New Password</label>
            <div style={inputWrapStyle}>
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                style={baseInputStyle}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={toggleBtnStyle}
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.newPassword && <p style={fieldErrorStyle}>{errors.newPassword}</p>}
          </div>

          {/* ── Confirm New Password ──────────────────────────────────────── */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="confirmPassword">Confirm New Password</label>
            <div style={inputWrapStyle}>
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                style={baseInputStyle}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={toggleBtnStyle}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && <p style={fieldErrorStyle}>{errors.confirmPassword}</p>}
          </div>

          {/* API-level error (wrong current password) shown above the button. */}
          {apiError && <p style={apiErrorStyle}>{apiError}</p>}

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordPage
