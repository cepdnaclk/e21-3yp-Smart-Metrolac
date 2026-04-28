import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getInvoices, getInvoicesByDateRange, getInvoicesByWeek } from '../../api/invoiceApi'

// Collection center ID is fixed at 1 for the current implementation.
const CENTER_ID = 1

// Format an ISO datetime string as "DD/MM/YYYY HH:mm".
function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const d    = new Date(dateStr)
  const dd   = String(d.getDate()).padStart(2, '0')
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh   = String(d.getHours()).padStart(2, '0')
  const min  = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

// Returns colour overrides for a pH/TDS status badge.
function statusColors(status) {
  switch (status?.toLowerCase()) {
    case 'warning':  return { backgroundColor: '#FEF9C3', color: '#D97706' }
    case 'critical': return { backgroundColor: '#FEE2E2', color: '#DC2626' }
    default:         return { backgroundColor: '#DCFCE7', color: '#16A34A' }  // normal
  }
}

function InvoiceListPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [invoices,   setInvoices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // 'dateRange' | 'weekYear' — controls which filter inputs are visible.
  const [filterMode, setFilterMode] = useState('dateRange')

  // Date range filter inputs.
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')

  // Week / year filter inputs; year pre-filled with the current year.
  const [week,       setWeek]       = useState('')
  const [year,       setYear]       = useState(String(new Date().getFullYear()))

  // Load all invoices on mount.
  useEffect(() => {
    if (!isAuthenticated) return
    loadAll()
  }, [])

  // Safety-net redirect.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const data = await getInvoices(CENTER_ID)
      setInvoices(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDateRangeApply() {
    if (!startDate || !endDate) return
    setLoading(true)
    setError('')
    try {
      // Append time components so the range covers full days.
      const data = await getInvoicesByDateRange(
        CENTER_ID,
        startDate + 'T00:00:00',
        endDate   + 'T23:59:59',
      )
      setInvoices(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }

  async function handleWeekYearApply() {
    if (!week || !year) return
    setLoading(true)
    setError('')
    try {
      const data = await getInvoicesByWeek(CENTER_ID, week, year)
      setInvoices(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }

  // Resets all filter inputs and reloads the full list.
  function handleClearFilters() {
    setStartDate('')
    setEndDate('')
    setWeek('')
    setYear(String(new Date().getFullYear()))
    loadAll()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>Invoices</h1>

      {/* ── Filter section ────────────────────────────────────────────────── */}
      <section style={filterSectionStyle}>

        {/* Toggle between Date Range and Week / Year filter modes */}
        <div style={filterModeRowStyle}>
          <button
            onClick={() => setFilterMode('dateRange')}
            style={filterMode === 'dateRange' ? activeModeBtnStyle : modeBtnStyle}
          >
            Date Range
          </button>
          <button
            onClick={() => setFilterMode('weekYear')}
            style={filterMode === 'weekYear' ? activeModeBtnStyle : modeBtnStyle}
          >
            Week / Year
          </button>
        </div>

        {/* Date range inputs — visible when filterMode is 'dateRange' */}
        {filterMode === 'dateRange' && (
          <div style={filterInputRowStyle}>
            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={filterInputStyle}
              />
            </div>
            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={filterInputStyle}
              />
            </div>
            <button
              onClick={handleDateRangeApply}
              disabled={!startDate || !endDate}
              style={!startDate || !endDate ? applyBtnDisabledStyle : applyBtnStyle}
            >
              Apply
            </button>
          </div>
        )}

        {/* Week / year inputs — visible when filterMode is 'weekYear' */}
        {filterMode === 'weekYear' && (
          <div style={filterInputRowStyle}>
            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>Week (1–53)</label>
              <input
                type="number"
                min="1"
                max="53"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                style={{ ...filterInputStyle, width: '80px' }}
                placeholder="e.g. 18"
              />
            </div>
            <div style={filterFieldStyle}>
              <label style={filterLabelStyle}>Year</label>
              <input
                type="number"
                min="2000"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ ...filterInputStyle, width: '100px' }}
              />
            </div>
            <button
              onClick={handleWeekYearApply}
              disabled={!week || !year}
              style={!week || !year ? applyBtnDisabledStyle : applyBtnStyle}
            >
              Apply
            </button>
          </div>
        )}

        {/* Resets all filters and reloads the full invoice list */}
        <button onClick={handleClearFilters} style={clearBtnStyle}>
          Clear Filters
        </button>

      </section>

      {/* ── Invoice table ─────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        {error ? (
          <p style={errorTextStyle}>{error}</p>
        ) : loading ? (
          <p style={mutedTextStyle}>Loading…</p>
        ) : invoices.length === 0 ? (
          <p style={mutedTextStyle}>No invoices found</p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Farmer', 'Date', 'DRC %', 'Total Litres', 'Total Amount', 'pH Status', 'TDS Status'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} style={trStyle}>

                    {/* Combine name and farmer code for quick identification */}
                    <td style={tdStyle}>
                      {invoice.farmerName} ({invoice.farmerCode})
                    </td>

                    <td style={tdStyle}>{formatDateTime(invoice.measurementDateTime)}</td>
                    <td style={tdStyle}>{invoice.drc}</td>
                    <td style={tdStyle}>{invoice.totalLitres}</td>
                    <td style={tdStyle}>Rs. {invoice.totalAmount}</td>

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
  gap: '1.25rem',
}

const pageTitleStyle = {
  fontSize: '1.35rem',
  fontWeight: '700',
  color: 'var(--color-text)',
}

const filterSectionStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}

const filterModeRowStyle = {
  display: 'flex',
  gap: '0.5rem',
}

// Base shared by both mode-toggle button states.
const modeBtnBase = {
  padding: '0.4rem 0.9rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
}

const modeBtnStyle = {
  ...modeBtnBase,
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
}

const activeModeBtnStyle = {
  ...modeBtnBase,
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: '1px solid var(--color-primary)',
}

const filterInputRowStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-end',  // aligns Apply button with bottom of label+input groups
  flexWrap: 'wrap',
}

const filterFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
}

const filterLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: '500',
  color: 'var(--color-text-muted)',
}

const filterInputStyle = {
  padding: '0.5rem 0.65rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  outline: 'none',
}

// Base shared by Apply and its disabled variant.
const applyBtnBase = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '600',
  border: 'none',
  color: '#ffffff',
}

const applyBtnStyle = {
  ...applyBtnBase,
  backgroundColor: 'var(--color-primary)',
  cursor: 'pointer',
}

const applyBtnDisabledStyle = {
  ...applyBtnBase,
  backgroundColor: 'var(--color-text-muted)',
  cursor: 'not-allowed',
}

const clearBtnStyle = {
  alignSelf: 'flex-start',
  padding: '0.4rem 0.9rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
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

const badgeBaseStyle = {
  display: 'inline-block',
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  textTransform: 'capitalize',
}

export default InvoiceListPage
