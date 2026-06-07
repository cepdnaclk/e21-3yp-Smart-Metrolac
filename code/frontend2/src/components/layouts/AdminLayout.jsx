import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { useLogout } from '../../utils/useLogout'

// Nav items for the company admin section.
const NAV_LINKS = [
  { label: 'Dashboard',         to: '/admin/dashboard'   },
  { label: 'Price Management',  to: '/admin/price'       },
  { label: 'Alerts',            to: '/admin/alerts'      },
  { label: 'Change Password',   to: '/change-password'   },
]

function AdminLayout({ children }) {
  const { user }     = useSelector((state) => state.auth)
  const handleLogout = useLogout()

  // ── Styles ─────────────────────────────────────────────────────────────────

  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '100vh',
    fontFamily: 'var(--font-sans)',
  }

  const sidebarStyle = {
    width: '240px',
    minHeight: '100vh',
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
  }

  // Base style shared by all nav links; active overrides are applied via NavLink className.
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
    minWidth: 0,  // prevents flex children from overflowing
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
  }

  return (
    <div style={containerStyle}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <img src="/logo.png" alt="Smart-Metrolac" style={{ width: '100%', objectFit: 'contain', display: 'block' }} />
        </div>

        {/* Nav links — NavLink automatically sets isActive when the URL matches. */}
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

        {/* Topbar */}
        <header style={topbarStyle}>
          <span style={topbarTitleStyle}>Company Admin Portal</span>
          <span style={topbarUserStyle}>Welcome, {user?.username}</span>
        </header>

        {/* Page content rendered here by child routes. */}
        <main style={contentStyle}>
          {children}
        </main>
      </div>

    </div>
  )
}

export default AdminLayout
