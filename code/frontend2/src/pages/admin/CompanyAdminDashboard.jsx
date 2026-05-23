import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import axiosClient from '../../api/axiosClient'

// Recharts cannot read CSS variables, so we use the hex value directly.
const PRIMARY_COLOR = '#2A5C3F'

// Maps severity string to a display colour. toLowerCase() handles both
// 'critical' and 'Critical' from the API.
function severityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return '#DC2626'
    case 'warning':  return '#D97706'
    default:         return '#2563EB'  // info
  }
}


function CompanyAdminDashboard() {
  const [data,    setData]    = useState({
    kpis: { totalCenters: 0, totalFarmers: 0 },
    chartData: [],
    alerts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Fetch dashboard data once on mount.
  useEffect(() => {
    axiosClient.get('/api/admin/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (error)   return <p style={{ ...statusStyle, color: 'var(--color-danger)' }}>{error}</p>
  if (loading) return <p style={statusStyle}>Loading dashboard...</p>

  return (
    <div style={pageStyle}>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div style={kpiRowStyle}>
        <KpiCard label="Total Collection Centers" value={data.kpis.totalCenters} />
        <KpiCard label="Total Farmers"            value={data.kpis.totalFarmers} />
      </div>

      {/* ── Bar Chart ────────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Monthly Litres per Center</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E4DC" />
            <XAxis dataKey="centerName" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 13 }} />
            <Tooltip />
            <Bar dataKey="totalLitres" fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* ── Latest Alerts table ───────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Latest Alerts</h2>
        {data.alerts.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No alerts found</p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Type', 'Severity', 'Message', 'Resolved'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.alerts.map((alert) => (
                  <tr key={alert.Alert_ID} style={trStyle}>
                    <td style={tdStyle}>{alert.Alert_Type}</td>
                    <td style={tdStyle}>
                      <span style={{ ...badgeStyle, backgroundColor: severityColor(alert.Severity) }}>
                        {alert.Severity}
                      </span>
                    </td>
                    <td style={tdStyle}>{alert.Message}</td>
                    <td style={tdStyle}>{alert.Resolved ? 'Yes' : 'No'}</td>
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

// ── Reusable KPI card (defined at module level to avoid remount bug) ─────────
function KpiCard({ label, value }) {
  return (
    <div style={kpiCardStyle}>
      <p style={kpiValueStyle}>{value}</p>
      <p style={kpiLabelStyle}>{label}</p>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
}

const statusStyle = {
  color: 'var(--color-text-muted)',
  fontSize: '0.95rem',
}

const kpiRowStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
}

const kpiCardStyle = {
  flex: '1 1 180px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
}

const kpiValueStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: 'var(--color-primary)',
  margin: 0,
}

const kpiLabelStyle = {
  fontSize: '0.85rem',
  color: 'var(--color-text-muted)',
  marginTop: '0.25rem',
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
  marginBottom: '1rem',
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

export default CompanyAdminDashboard
