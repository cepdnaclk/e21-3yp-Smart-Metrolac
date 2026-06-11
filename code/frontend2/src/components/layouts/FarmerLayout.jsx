import { useSelector } from 'react-redux'
import { NavLink, useLocation } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import { useLogout } from '../../utils/useLogout'

// Nav items for the farmer section.
const NAV_LINKS = [
  { label: 'Payment History', to: '/farmer/payments'  },
  { label: 'Change Password', to: '/change-password'  },
]

// Parse the last URL segment into a Title Case page name.
// e.g. /farmer/payments → "Payments"
function getPageName(pathname) {
  const segment = pathname.split('/').filter(Boolean).pop() || ''
  return segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Map the first character of a username to a role label.
function getRoleLabel(username) {
  const c = username?.charAt(0).toUpperCase()
  if (c === 'A') return 'Company Admin'
  if (c === 'M') return 'Center Admin'
  if (c === 'F') return 'Farmer'
  return ''
}

function FarmerLayout({ children }) {
  const { user }     = useSelector((state) => state.auth)
  const handleLogout = useLogout()
  const location     = useLocation()
  const pageName     = getPageName(location.pathname)

  // ── Styles ─────────────────────────────────────────────────────────────────

  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  }

  const sidebarStyle = {
    width: '240px',
    backgroundColor: 'var(--color-primary)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  }

  const sidebarHeaderStyle = {
    padding: '1.5rem 1.25rem 1rem',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
  }

  const navStyle = {
    flex: 1,
    padding: '1rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
    minHeight: 0,
  }

  function navLinkStyle({ isActive }) {
    return {
      display: 'block',
      padding: '0.6rem 0.875rem',
      borderRadius: 'var(--radius-md)',
      color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.85)',
      backgroundColor: isActive ? 'var(--color-primary-lighter)' : 'transparent',
      fontWeight: isActive ? '600' : '400',
      fontSize: '0.9rem',
      textDecoration: 'none',
      transition: 'background-color 0.15s',
    }
  }

  const sidebarFooterStyle = {
    padding: '1rem 0.75rem',
    borderTop: '1px solid rgba(255,255,255,0.15)',
  }

  const logoutBtnStyle = {
    width: '100%',
    padding: '0.6rem 0.875rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textAlign: 'left',
  }

  const mainStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    minHeight: 0,
  }

  const contentStyle = {
    flex: 1,
    backgroundColor: 'var(--color-bg)',
    padding: '1.5rem',
    overflowY: 'auto',
    minHeight: 0,
  }

  return (
    <div style={containerStyle}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <img src="/logo.png" alt="Smart-Metrolac" style={{ width: '100%', objectFit: 'contain', display: 'block' }} />
        </div>

        <nav style={navStyle}>
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink key={to} to={to} style={navLinkStyle}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={sidebarFooterStyle}>
          <button style={logoutBtnStyle} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div style={mainStyle}>

        {/* ── Topbar ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-8 flex-shrink-0">

          {/* Left: accent dot · role title · chevron · page name */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#42C23D]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Farmer Portal
            </span>
            <ChevronRight size={14} color="#D1D5DB" />
            <span className="text-base font-semibold text-[#111827]">
              {pageName}
            </span>
          </div>

          {/* Right: bell · divider · user chip */}
          <div className="flex items-center gap-3">

            <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
              <Bell size={18} color="#6B7280" />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #173404 0%, #2d5a0c 100%)', color: '#EAF3DE' }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-[#111827] leading-tight">{user?.username}</span>
                <span className="text-xs text-[#6B7280] leading-tight">{getRoleLabel(user?.username)}</span>
              </div>
            </div>

          </div>
        </header>

        <main style={contentStyle}>
          {children}
        </main>
      </div>

    </div>
  )
}

export default FarmerLayout
