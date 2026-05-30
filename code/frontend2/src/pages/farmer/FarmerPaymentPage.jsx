import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getPaymentsByFarmer, getPaymentsByFarmerAndWeek } from '../../api/paymentApi'

// TODO: get farmerId from JWT token
const FARMER_ID = 1

// Sums totalAmount across all displayed payment rows.
function calcTotalEarnings(payments) {
  return payments.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0)
}

function FarmerPaymentPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [payments,  setPayments]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  // Filter inputs — week is a string so the controlled input stays simple.
  const [week, setWeek] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))

  // Load all payments for this farmer on mount.
  useEffect(() => {
    if (!isAuthenticated) return
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Safety-net redirect.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const data = await getPaymentsByFarmer(FARMER_ID)
      setPayments(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  // ── Filter actions ─────────────────────────────────────────────────────────

  async function handleApply() {
    setLoading(true)
    setError('')
    try {
      const data = await getPaymentsByFarmerAndWeek(FARMER_ID, Number(week), Number(year))
      setPayments(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  // Reset inputs and reload all payments.
  function handleClear() {
    setWeek('')
    setYear(String(new Date().getFullYear()))
    loadAll()
  }

  // Apply is only available when both week and year have values.
  const canApply = week.trim() !== '' && year.trim() !== ''

  const totalEarnings = calcTotalEarnings(payments)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>My Payment History</h1>

      {/* ── Week / Year filter ────────────────────────────────────────────── */}
      <div style={filterRowStyle}>
        <input
          type="number"
          placeholder="Week"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          style={inputStyle}
          min={1}
          max={53}
        />
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={inputStyle}
          min={2000}
        />
        <button
          onClick={handleApply}
          disabled={!canApply || loading}
          style={canApply && !loading ? applyBtnStyle : applyBtnDisabledStyle}
        >
          Apply
        </button>
        <button onClick={handleClear} style={clearBtnStyle}>
          Clear
        </button>
      </div>

      {/* ── Summary card ──────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div style={summaryCardStyle}>
          <span style={summaryLabelStyle}>Total Earnings:</span>
          <span style={summaryAmountStyle}>Rs. {totalEarnings.toFixed(2)}</span>
        </div>
      )}

      {/* ── Payment table ─────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        {error ? (
          <p style={errorTextStyle}>{error}</p>
        ) : loading ? (
          <p style={mutedTextStyle}>Loading…</p>
        ) : payments.length === 0 ? (
          <p style={mutedTextStyle}>No payments found</p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Week', 'Year', 'Total Amount'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} style={trStyle}>
                    <td style={tdStyle}>{payment.week}</td>
                    <td style={tdStyle}>{payment.year}</td>
                    <td style={tdStyle}>Rs. {payment.totalAmount}</td>
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
  alignItems: 'center',
  flexWrap: 'wrap',
}

const inputStyle = {
  padding: '0.45rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-surface)',
  width: '7rem',
}

// Base shared by Apply button states.
const applyBtnBase = {
  padding: '0.45rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  border: 'none',
}

const applyBtnStyle = {
  ...applyBtnBase,
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
}

const applyBtnDisabledStyle = {
  ...applyBtnBase,
  backgroundColor: 'var(--color-border)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
}

const clearBtnStyle = {
  padding: '0.45rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
}

const summaryCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '0.9rem 1.25rem',
}

const summaryLabelStyle = {
  fontSize: '0.95rem',
  fontWeight: '500',
  color: 'var(--color-text-muted)',
}

const summaryAmountStyle = {
  fontSize: '1.15rem',
  fontWeight: '700',
  color: 'var(--color-accent)',
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

export default FarmerPaymentPage
