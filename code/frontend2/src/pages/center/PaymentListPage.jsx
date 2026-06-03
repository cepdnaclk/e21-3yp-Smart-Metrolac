import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getPaymentsByCenter, calculatePayment } from '../../api/paymentApi'

// Collection center ID is fixed at 1 for the current implementation.
const CENTER_ID = 1

function PaymentListPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [payments,      setPayments]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')

  // Feedback messages shown above the table.
  const [successMsg,    setSuccessMsg]    = useState('')
  const [actionError,   setActionError]   = useState('')

  // ID of the payment currently being recalculated — drives per-row button state.
  const [calculatingId, setCalculatingId] = useState(null)

  // Load all payments on mount.
  useEffect(() => {
    if (!isAuthenticated) return
    loadPayments()
  }, [])

  // Safety-net redirect.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadPayments() {
    setLoading(true)
    setError('')
    try {
      const data = await getPaymentsByCenter(CENTER_ID)
      setPayments(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  // ── Recalculate ────────────────────────────────────────────────────────────

  async function handleRecalculate(payment) {
    // Track which row is loading by storing its ID.
    setCalculatingId(payment.id)
    setSuccessMsg('')
    setActionError('')
    try {
      await calculatePayment(payment.farmerId, payment.week, payment.year)
      setSuccessMsg('Payment recalculated successfully')
      // Refresh the list so the updated amount is shown immediately.
      await loadPayments()
    } catch {
      setActionError('Failed to recalculate payment.')
    } finally {
      setCalculatingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>Payments</h1>

      {/* ── Inline feedback messages ─────────────────────────────────────── */}
      {successMsg  && <p style={successMsgStyle}>{successMsg}</p>}
      {actionError && <p style={actionErrorStyle}>{actionError}</p>}

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
                  {['Farmer', 'Week', 'Year', 'Total Amount', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  // Determine if this specific row's button is in loading state.
                  const isCalculating = calculatingId === payment.id
                  return (
                    <tr key={payment.id} style={trStyle}>

                      <td style={tdStyle}>{payment.farmerName}</td>

                      <td style={tdStyle}>{payment.week}</td>
                      <td style={tdStyle}>{payment.year}</td>
                      <td style={tdStyle}>Rs. {payment.totalAmount}</td>

                      <td style={tdStyle}>
                        <button
                          onClick={() => handleRecalculate(payment)}
                          disabled={isCalculating}
                          style={isCalculating ? recalcBtnLoadingStyle : recalcBtnStyle}
                        >
                          {isCalculating ? '...' : 'Recalculate'}
                        </button>
                      </td>

                    </tr>
                  )
                })}
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

const successMsgStyle = {
  fontSize: '0.9rem',
  color: 'var(--color-success)',
  backgroundColor: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: 'var(--radius-md)',
  padding: '0.6rem 1rem',
  margin: 0,
}

const actionErrorStyle = {
  fontSize: '0.9rem',
  color: 'var(--color-danger)',
  backgroundColor: 'var(--color-danger-light)',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: '0.6rem 1rem',
  margin: 0,
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

// Base shared by the recalculate button and its loading variant.
const recalcBtnBase = {
  padding: '0.3rem 0.7rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.8rem',
  fontWeight: '500',
  backgroundColor: 'transparent',
}

const recalcBtnStyle = {
  ...recalcBtnBase,
  color: 'var(--color-primary)',
  border: '1px solid var(--color-primary)',
  cursor: 'pointer',
}

const recalcBtnLoadingStyle = {
  ...recalcBtnBase,
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  cursor: 'not-allowed',
}

export default PaymentListPage
