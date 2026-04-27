import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getAlerts, getUnresolvedAlerts } from '../../api/alertApi'

// Format an ISO date string as "27/04/2026".
function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-GB')
}

// Maps severity string to a badge colour — case-insensitive.
function severityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return '#DC2626'
    case 'warning':  return '#D97706'
    default:         return '#2563EB'  // info
  }
}

function AdminAlertsPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [alerts,  setAlerts]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // 'all' | 'unresolved' — changing this triggers a re-fetch via useEffect.
  const [filter, setFilter] = useState('all')

  // Re-fetch whenever the filter changes (also runs on mount).
  useEffect(() => {
    if (!isAuthenticated) return
    loadAlerts()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Safety-net redirect — ProtectedRoute wrapper handles this first in practice.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadAlerts() {
    setLoading(true)
    setError('')
    try {
      // centerId=1 hardcoded for company admin.
      const data = filter === 'unresolved'
        ? await getUnresolvedAlerts(1)
        : await getAlerts(1)
      setAlerts(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load alerts.')
    } finally {
      setLoading(false)
    }
  }

  // Switch the active filter; useEffect handles the re-fetch.
  function handleFilterChange(newFilter) {
    if (newFilter !== filter) setFilter(newFilter)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>All Alerts</h1>

      {/* ── Filter toggle ─────────────────────────────────────────────────── */}
      <div style={filterRowStyle}>
        <button
          onClick={() => handleFilterChange('all')}
          style={filter === 'all' ? activeFilterBtnStyle : filterBtnStyle}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange('unresolved')}
          style={filter === 'unresolved' ? activeFilterBtnStyle : filterBtnStyle}
        >
          Unresolved
        </button>
      </div>

      {/* ── Alerts table ──────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        {error ? (
          <p style={errorTextStyle}>{error}</p>
        ) : loading ? (
          <p style={mutedTextStyle}>Loading…</p>
        ) : alerts.length === 0 ? (
          <p style={mutedTextStyle}>No alerts found</p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Type', 'Severity', 'Message', 'Created', 'Resolved By', 'Resolved'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.alertId} style={trStyle}>

                    <td style={tdStyle}>{alert.alertType}</td>

                    <td style={tdStyle}>
                      <span style={{ ...badgeStyle, backgroundColor: severityColor(alert.severity) }}>
                        {alert.severity}
                      </span>
                    </td>

                    <td style={tdStyle}>{alert.message}</td>

                    <td style={tdStyle}>{formatDate(alert.createdDate)}</td>

                    {/* Show username of whoever resolved the alert, or dash if still open */}
                    <td style={tdStyle}>{alert.resolvedByUsername ?? '-'}</td>

                    {/* Green text for resolved, red for unresolved */}
                    <td style={tdStyle}>
                      <span style={alert.resolved ? resolvedYesStyle : resolvedNoStyle}>
                        {alert.resolved ? 'Yes' : 'No'}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
}

const pageTitleStyle = {
  fontSize: '1.35rem',
  fontWeight: '700',
  color: 'var(--color-text)',
}

const filterRowStyle = {
  display: 'flex',
  gap: '0.5rem',
}

// Base shared by both filter button states.
const filterBtnBase = {
  padding: '0.45rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
}

const filterBtnStyle = {
  ...filterBtnBase,
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
}

const activeFilterBtnStyle = {
  ...filterBtnBase,
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: '1px solid var(--color-primary)',
}

const sectionStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
}

const mutedTextStyle = {
  color: 'var(--color-text-muted)',
  fontSize: '0.9rem',
}

const errorTextStyle = {
  color: 'var(--color-danger)',
  fontSize: '0.9rem',
}

const tableWrapStyle = {
  overflowX: 'auto',
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
}

const thStyle = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  borderBottom: '2px solid var(--color-border)',
  color: 'var(--color-text-muted)',
  fontWeight: '600',
  whiteSpace: 'nowrap',
}

const trStyle = {
  borderBottom: '1px solid var(--color-border)',
}

const tdStyle = {
  padding: '0.6rem 0.75rem',
  color: 'var(--color-text)',
  verticalAlign: 'middle',
}

const badgeStyle = {
  display: 'inline-block',
  color: '#ffffff',
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  textTransform: 'capitalize',
}

const resolvedYesStyle = {
  color: 'var(--color-success)',
  fontWeight: '600',
  fontSize: '0.875rem',
}

const resolvedNoStyle = {
  color: 'var(--color-danger)',
  fontWeight: '600',
  fontSize: '0.875rem',
}

export default AdminAlertsPage
