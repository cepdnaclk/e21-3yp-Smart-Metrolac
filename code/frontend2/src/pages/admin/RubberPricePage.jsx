import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getCurrentPrice, setPrice } from '../../api/priceApi'

// Company ID is fixed at 1 for the current implementation.
const COMPANY_ID = 1

function RubberPricePage() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  // Current price fetched from the API; null means no price has been set today.
  const [currentPrice, setCurrentPrice] = useState(null)
  const [loadingPrice, setLoadingPrice] = useState(true)

  // Form state
  const [priceInput, setPriceInput] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg,   setErrorMsg]   = useState('')

  // Fetch today's price on mount; skip if not authenticated.
  useEffect(() => {
    if (!isAuthenticated) return
    loadCurrentPrice()
  }, [])

  // Safety-net redirect — the ProtectedRoute wrapper should handle this first.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function loadCurrentPrice() {
    setLoadingPrice(true)
    try {
      const data = await getCurrentPrice(COMPANY_ID)
      // Treat null / empty response as "no price set for today".
      setCurrentPrice(data?.pricePerKg != null ? data : null)
    } catch {
      setCurrentPrice(null)
    } finally {
      setLoadingPrice(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')

    const value = parseFloat(priceInput)
    if (!priceInput || isNaN(value) || value <= 0) {
      setErrorMsg('Please enter a valid price.')
      return
    }

    setSaving(true)
    try {
      await setPrice(COMPANY_ID, value)
      setSuccessMsg('Price updated successfully')
      setPriceInput('')
      // Refresh the left card with the newly saved price.
      await loadCurrentPrice()
    } catch {
      setErrorMsg('Failed to update price.')
    } finally {
      setSaving(false)
    }
  }

  // Format a numeric value as "Rs. 850.00 / kg"
  function formatPrice(value) {
    return `Rs. ${Number(value).toFixed(2)} / kg`
  }

  // Format an ISO date string as "27/04/2026"
  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>Rubber Price Management</h1>

      {/* ── Two-card row: stacks on narrow screens via flexWrap ──────────── */}
      <div style={cardsRowStyle}>

        {/* ── LEFT card — Today's Price ─────────────────────────────────── */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Today's Price</h2>

          {loadingPrice ? (
            <p style={mutedTextStyle}>Loading…</p>
          ) : currentPrice ? (
            <>
              {/* Accent-colour large price display */}
              <p style={priceDisplayStyle}>{formatPrice(currentPrice.pricePerKg)}</p>
              <p style={effectiveDateStyle}>
                Effective: {formatDate(currentPrice.effectiveDate)}
              </p>
            </>
          ) : (
            /* Amber warning when no price has been set for today */
            <div style={warningBoxStyle}>
              <p style={warningTextStyle}>No price set for today</p>
            </div>
          )}
        </div>

        {/* ── RIGHT card — Update Price form ────────────────────────────── */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Update Price</h2>

          <form onSubmit={handleSubmit} style={formStyle}>

            <label htmlFor="priceInput" style={labelStyle}>
              Price per Kg (Rs.)
            </label>

            <input
              id="priceInput"
              type="number"
              step="0.01"
              min="0"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value)
                // Clear feedback when the user starts typing again.
                setSuccessMsg('')
                setErrorMsg('')
              }}
              style={inputStyle}
              placeholder="e.g. 850.00"
            />

            {/* Inline feedback messages */}
            {errorMsg   && <p style={errorMsgStyle}>{errorMsg}</p>}
            {successMsg && <p style={successMsgStyle}>{successMsg}</p>}

            <button
              type="submit"
              disabled={saving}
              style={saving ? btnDisabledStyle : btnStyle}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>

          </form>
        </div>

      </div>
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

const cardsRowStyle = {
  display: 'flex',
  gap: '1.5rem',
  flexWrap: 'wrap',          // cards stack vertically on narrow screens
  alignItems: 'flex-start',
}

const cardStyle = {
  flex: '1 1 280px',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
}

const cardTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--color-text)',
  marginBottom: '1rem',
}

const priceDisplayStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: 'var(--color-accent)',  // #C8891A — amber/gold
  margin: 0,
}

const effectiveDateStyle = {
  fontSize: '0.85rem',
  color: 'var(--color-text-muted)',
  marginTop: '0.5rem',
}

const mutedTextStyle = {
  fontSize: '0.9rem',
  color: 'var(--color-text-muted)',
}

const warningBoxStyle = {
  backgroundColor: '#FEF3C7',   // amber-100
  border: '1px solid #D97706',  // amber-600
  borderRadius: 'var(--radius-md)',
  padding: '0.75rem 1rem',
}

const warningTextStyle = {
  color: '#92400E',  // amber-800
  fontSize: '0.9rem',
  fontWeight: '500',
  margin: 0,
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--color-text)',
}

const inputStyle = {
  padding: '0.6rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.95rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  outline: 'none',
  width: '100%',
}

const errorMsgStyle = {
  fontSize: '0.85rem',
  color: 'var(--color-danger)',
  margin: 0,
}

const successMsgStyle = {
  fontSize: '0.85rem',
  color: 'var(--color-success)',
  margin: 0,
}

// Shared base so the disabled state only overrides what changes.
const btnBase = {
  padding: '0.65rem 1.25rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9rem',
  fontWeight: '600',
  border: 'none',
  color: '#ffffff',
  alignSelf: 'flex-start',
}

const btnStyle = {
  ...btnBase,
  backgroundColor: 'var(--color-primary)',
  cursor: 'pointer',
}

const btnDisabledStyle = {
  ...btnBase,
  backgroundColor: 'var(--color-text-muted)',
  cursor: 'not-allowed',
}

export default RubberPricePage
