import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
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

  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await loginApi(username, password)
      dispatch(loginSuccess({ token: data.token }))
      const decoded = jwtDecode(data.token)
      navigate(getDashboardRoute(decoded.role))
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#FAF7F2', fontFamily: 'var(--font-sans)' }}
    >
      {/* ── Card ────────────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col lg:flex-row overflow-hidden w-[92%] lg:min-h-[760px]"
        style={{
          maxWidth: '1152px',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 50px -20px rgba(23, 52, 4, 0.15)',
        }}
      >

        {/* ── Left: photo — floats inside card with padding, natural ratio ── */}
        <div className="w-full lg:w-1/2 p-6 lg:p-8 bg-white flex items-center justify-center">
          <img
            src="/device.jpeg"
            alt="Smart-Metrolac device"
            className="w-full h-auto rounded-2xl"
          />
        </div>

        {/* ── Right: form — centered, clear gap from photo ─────────────────── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:pl-16 lg:pr-12 lg:py-16 bg-white">

          {/* Inner form container — caps width so nothing bleeds to edges */}
          <div className="w-full max-w-sm">

            {/* Brand row */}
            <div className="flex items-center justify-center gap-2 mb-14">
              <img src="/logo.png" alt="Smart-Metrolac logo" className="h-7 w-auto object-contain" />
              <span className="text-sm font-medium tracking-wide" style={{ color: '#173404' }}>
                Smart-Metrolac
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-5xl font-normal tracking-tight leading-tight text-center"
              style={{ color: '#0a1f00', fontFamily: "'Fraunces', serif" }}
            >
              Welcome <span className="italic">back</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base font-light text-center mt-3 mb-16" style={{ color: '#6B7280' }}>
              Sign in to continue to your dashboard
            </p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Username */}
              <div className="mb-16">
                <label
                  className="block font-semibold uppercase text-[11px] tracking-[0.15em] mb-3"
                  style={{ color: '#9CA3AF' }}
                >
                  USERNAME
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full py-4 text-base text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-[#0cf249] transition-colors"
                />
              </div>

              {/* Password */}
              <div className="mb-12">
                <label
                  className="block font-semibold uppercase text-[11px] tracking-[0.15em] mb-3"
                  style={{ color: '#9CA3AF' }}
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full py-3 pr-10 text-base text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-[#0cf249] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <a
                  href="#"
                  className="block text-right text-xs mt-2 hover:underline"
                  style={{ color: '#0cf249' }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: '#0cf249', color: '#0a2e02' }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#0bd942' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#0cf249' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              {/* Footer note */}
              <p className="mt-12 text-center text-xs font-light italic tracking-wide" style={{ color: '#9CA3AF' }}>
                Trouble signing in? Contact your administrator
              </p>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
