import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getFarmers } from '../../api/farmerApi'
import { getInvoices, getInvoicesByWeek } from '../../api/invoiceApi'
import { getUnresolvedAlerts } from '../../api/alertApi'

const CENTER_ID = 1

// Returns the current ISO week number.
function getCurrentWeek() {
  const now          = new Date()
  const startOfYear  = new Date(now.getFullYear(), 0, 1)
  return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
}

// Format an ISO datetime string as "DD/MM/YYYY".
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB')
}

// Returns background and text color for a status badge.
function statusColors(status) {
  switch (status?.toLowerCase()) {
    case 'critical': return { backgroundColor: '#FEE2E2', color: '#DC2626' }
    case 'warning':  return { backgroundColor: '#FEF9C3', color: '#D97706' }
    default:         return { backgroundColor: '#DCFCE7', color: '#16A34A' }
  }
}

function CenterDashboard() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  // KPI counts derived from parallel API calls.
  const [farmerCount,  setFarmerCount]  = useState(0)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [alertCount,   setAlertCount]   = useState(0)

  // Latest 5 invoices for the recent invoices table.
  const [recentInvoices, setRecentInvoices] = useState([])

  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!isAuthenticated) return
    loadDashboard()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Safety-net redirect.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const week = getCurrentWeek()
      const year = new Date().getFullYear()

      // Fire all 4 requests at once to minimise load time.
      const [farmers, weekInvoices, alerts, allInvoices] = await Promise.all([
        getFarmers(CENTER_ID),
        getInvoicesByWeek(CENTER_ID, week, year),
        getUnresolvedAlerts(CENTER_ID),
        getInvoices(CENTER_ID),
      ])

      setFarmerCount(Array.isArray(farmers)      ? farmers.length      : 0)
      setInvoiceCount(Array.isArray(weekInvoices) ? weekInvoices.length : 0)
      setAlertCount(Array.isArray(alerts)         ? alerts.length       : 0)

      // Show only the 5 most recent invoices.
      setRecentInvoices(Array.isArray(allInvoices) ? allInvoices.slice(0, 5) : [])
    } catch {
      setError('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <p style={mutedTextStyle}>Loading dashboard...</p>
  if (error)   return <p style={errorTextStyle}>{error}</p>

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>Dashboard</h1>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div style={kpiRowStyle}>

        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Total Farmers</p>
          <p style={{ ...kpiValueStyle, color: 'var(--color-primary)' }}>{farmerCount}</p>
        </div>

        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Invoices This Week</p>
          <p style={{ ...kpiValueStyle, color: 'var(--color-primary)' }}>{invoiceCount}</p>
        </div>

        {/* Alert count is red when > 0, green when clear. */}
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Unresolved Alerts</p>
          <p style={{
            ...kpiValueStyle,
            color: alertCount > 0 ? 'var(--color-danger)' : 'var(--color-success)',
          }}>
            {alertCount}
          </p>
        </div>

      </div>

      {/* ── Recent invoices table ─────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Recent Invoices</h2>

        {recentInvoices.length === 0 ? (
          <p style={mutedTextStyle}>No invoices found</p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Farmer', 'Date', 'Total Litres', 'pH Status', 'TDS Status'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} style={trStyle}>

                    <td style={tdStyle}>
                      {invoice.farmerName}
                      {invoice.farmerCode && (
                        <span style={farmerCodeStyle}> ({invoice.farmerCode})</span>
                      )}
                    </td>

                    <td style={tdStyle}>{formatDate(invoice.measurementDateTime)}</td>

                    <td style={tdStyle}>{invoice.totalLitres}</td>

                    <td style={tdStyle}>
                      <span style={{ ...badgeBaseStyle, ...statusColors(invoice.phStatus) }}>
                        {invoice.phStatus}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <span style={{ ...badgeBaseStyle, ...statusColors(invoice.tdsStatus) }}>
                        {invoice.tdsStatus}
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
  gap: '1.5rem',
}

const pageTitleStyle = {
  fontSize: '1.35rem',
  fontWeight: '700',
  color: 'var(--color-text)',
}

const mutedTextStyle = {
  color: 'var(--color-text-muted)',
  fontSize: '0.9rem',
}

const errorTextStyle = {
  color: 'var(--color-danger)',
  fontSize: '0.9rem',
}

const kpiRowStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
}

const kpiCardStyle = {
  flex: '1 1 160px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
}

const kpiLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: '500',
  color: 'var(--color-text-muted)',
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const kpiValueStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  margin: 0,
}

const sectionStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
}

const sectionTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--color-text)',
  margin: '0 0 1rem',
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

const farmerCodeStyle = {
  color: 'var(--color-text-muted)',
  fontSize: '0.8rem',
}

const badgeBaseStyle = {
  display: 'inline-block',
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  textTransform: 'capitalize',
}

export default CenterDashboard
