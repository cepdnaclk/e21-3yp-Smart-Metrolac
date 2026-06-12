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

  const topbarStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    height: '64px',
    backgroundColor: '#F2F7EC',
    borderBottom: '1px solid #E3EDD8',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    flexShrink: 0,
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
        <header style={topbarStyle}>

          {/* Left: accent dot · role title · chevron · page name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#42C23D' }} />
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#5C7A45' }}>
              Farmer Portal
            </span>
            <ChevronRight size={14} color="#A9BF93" />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#173404' }}>
              {pageName}
            </span>
          </div>

          {/* Right: bell · divider · user chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <button
              className="hover:bg-[#E3EDD8]"
              style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', transition: 'background-color 0.15s' }}
            >
              <Bell size={18} color="#5C7A45" />
            </button>

            <div style={{ width: '1px', height: '24px', backgroundColor: '#D5E3C4' }} />

            <div
              className="hover:bg-[#E9F1DF]"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.15s' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0, background: 'linear-gradient(135deg, #173404 0%, #2d5a0c 100%)', color: '#EAF3DE' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#173404', lineHeight: 1.25 }}>{user?.username}</span>
                <span style={{ fontSize: '12px', color: '#5C7A45', lineHeight: 1.25 }}>{getRoleLabel(user?.username)}</span>
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
