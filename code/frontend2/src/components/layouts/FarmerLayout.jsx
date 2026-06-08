import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { useLogout } from '../../utils/useLogout'

// Nav items for the farmer section.
const NAV_LINKS = [
  { label: 'Payment History', to: '/farmer/payments'  },
  { label: 'Change Password', to: '/change-password'  },
]

function FarmerLayout({ children }) {
  const { user }     = useSelector((state) => state.auth)
  const handleLogout = useLogout()

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

  const appNameStyle = {
    color: '#ffffff',
    fontSize: '1.1rem',
    fontWeight: '700',
    margin: 0,
  }

  const subtitleStyle = {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
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
    height: '56px',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    flexShrink: 0,
  }

  const topbarTitleStyle = {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--color-text)',
  }

  const topbarUserStyle = {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
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

        <header style={topbarStyle}>
          <span style={topbarTitleStyle}>Farmer Portal</span>
          <span style={topbarUserStyle}>Welcome, {user?.username}</span>
        </header>

        <main style={contentStyle}>
          {children}
        </main>
      </div>

    </div>
  )
}

export default FarmerLayout
