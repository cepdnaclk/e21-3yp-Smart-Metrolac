import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { X, Plus } from 'lucide-react'
import { getInvoices } from '../../api/invoiceApi'

// Collection center ID is fixed at 1 for the current implementation.
const CENTER_ID     = 1
const DEFAULT_LIMIT = 25
const FILTER_TYPES  = ['Farmer ID', 'Date Range', 'Amount Range']

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

// Format a numeric farmer ID as F0001, F0012, etc.
function formatFarmerId(id) {
  return 'F' + String(id).padStart(4, '0')
}

// Returns colour overrides for a pH/TDS status badge.
function statusColors(status) {
  switch (status?.toLowerCase()) {
    case 'warning':  return { backgroundColor: '#FEF9C3', color: '#D97706' }
    case 'critical': return { backgroundColor: '#FEE2E2', color: '#DC2626' }
    default:         return { backgroundColor: '#DCFCE7', color: '#16A34A' }
  }
}

function emptyFilter() {
  return {
    type: 'Farmer ID',
    farmerId:  '',
    startDate: '', endDate: '',
    minAmount: '', maxAmount: '',
    committed: false,
  }
}

// A row is "active" (contributes to filtering) when its required fields are filled.
// Date Range and Amount Range additionally require the Apply button to be clicked.
function isRowActive(row) {
  if (row.type === 'Farmer ID')    return row.farmerId !== ''
  if (row.type === 'Date Range')   return row.committed && row.startDate !== '' && row.endDate !== ''
  if (row.type === 'Amount Range') return row.committed && (row.minAmount !== '' || row.maxAmount !== '')
  return false
}

function InvoiceListPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [invoices,   setInvoices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [filterRows, setFilterRows] = useState([emptyFilter()])

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

  // ── Derived display list ───────────────────────────────────────────────────

  // Sort descending by date once; all derived views use this array.
  const sorted = [...invoices].sort(
    (a, b) => new Date(b.measurementDateTime) - new Date(a.measurementDateTime)
  )

  const activeCount   = filterRows.filter(isRowActive).length
  const filtersActive = activeCount > 0

  // Apply all active filter rows (ANDed) or cap at DEFAULT_LIMIT.
  let displayed = sorted
  if (filtersActive) {
    for (const row of filterRows) {
      if (!isRowActive(row)) continue
      if (row.type === 'Farmer ID') {
        displayed = displayed.filter(inv => String(inv.farmerId) === row.farmerId)
      } else if (row.type === 'Date Range') {
        const start = new Date(row.startDate + 'T00:00:00')
        const end   = new Date(row.endDate   + 'T23:59:59')
        displayed = displayed.filter(inv => {
          const d = new Date(inv.measurementDateTime)
          return d >= start && d <= end
        })
      } else if (row.type === 'Amount Range') {
        const min = row.minAmount !== '' ? parseFloat(row.minAmount) : -Infinity
        const max = row.maxAmount !== '' ? parseFloat(row.maxAmount) :  Infinity
        displayed = displayed.filter(inv => inv.totalAmount >= min && inv.totalAmount <= max)
      }
    }
  } else {
    displayed = sorted.slice(0, DEFAULT_LIMIT)
  }

  // ── Filter row handlers ────────────────────────────────────────────────────

  function updateRow(idx, field, value) {
    // Editing any field marks the row un-committed until Apply is clicked again.
    setFilterRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value, committed: false } : r))
  }

  function applyRow(idx) {
    setFilterRows(prev => prev.map((r, i) => i === idx ? { ...r, committed: true } : r))
  }

  function changeRowType(idx, type) {
    setFilterRows(prev => prev.map((r, i) => i === idx ? { ...emptyFilter(), type } : r))
  }

  function addRow() {
    if (filterRows.length < 2) setFilterRows(prev => [...prev, emptyFilter()])
  }

  function removeRow(idx) {
    setFilterRows(prev => prev.filter((_, i) => i !== idx))
  }

  function clearAll() {
    setFilterRows([emptyFilter()])
  }

  // ── Filter input block per row type ───────────────────────────────────────

  const inputCls = 'bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400'

  function renderInputs(row, idx) {
    if (row.type === 'Farmer ID') {
      return (
        <input
          type="number"
          value={row.farmerId}
          onChange={e => updateRow(idx, 'farmerId', e.target.value)}
          placeholder="Farmer ID"
          className={`${inputCls} w-32`}
        />
      )
    }

    if (row.type === 'Date Range') {
      const canApply = row.startDate !== '' && row.endDate !== ''
      return (
        <>
          <input
            type="date"
            value={row.startDate}
            onChange={e => updateRow(idx, 'startDate', e.target.value)}
            className={inputCls}
          />
          <input
            type="date"
            value={row.endDate}
            onChange={e => updateRow(idx, 'endDate', e.target.value)}
            className={inputCls}
          />
          <button
            onClick={() => applyRow(idx)}
            disabled={!canApply}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              canApply
                ? 'bg-[#173404] text-white hover:bg-green-900 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Apply
          </button>
        </>
      )
    }

    if (row.type === 'Amount Range') {
      const canApply = row.minAmount !== '' || row.maxAmount !== ''
      return (
        <>
          <input
            type="number"
            value={row.minAmount}
            onChange={e => updateRow(idx, 'minAmount', e.target.value)}
            placeholder="Min Rs."
            className={`${inputCls} w-28`}
          />
          <input
            type="number"
            value={row.maxAmount}
            onChange={e => updateRow(idx, 'maxAmount', e.target.value)}
            placeholder="Max Rs."
            className={`${inputCls} w-28`}
          />
          <button
            onClick={() => applyRow(idx)}
            disabled={!canApply}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              canApply
                ? 'bg-[#173404] text-white hover:bg-green-900 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Apply
          </button>
        </>
      )
    }

    return null
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>Invoices</h1>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 p-4 mb-6"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        {filterRows.map((row, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 flex-wrap${idx < filterRows.length - 1 ? ' mb-3' : ''}`}
          >
            {/* Filter type selector */}
            <select
              value={row.type}
              onChange={e => changeRowType(idx, e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-200"
              style={{ minWidth: '140px' }}
            >
              {FILTER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>

            {/* Inputs for the selected filter type */}
            {renderInputs(row, idx)}

            {/* Remove button — only on the second row */}
            {idx > 0 && (
              <button
                onClick={() => removeRow(idx)}
                aria-label="Remove filter"
                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        {/* Add Filter / Clear All row */}
        <div className="flex items-center gap-4 mt-1">
          {filterRows.length < 2 && (
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-sm font-medium text-[#173404] hover:underline cursor-pointer"
            >
              <Plus size={14} />
              Add Filter
            </button>
          )}
          <button
            onClick={clearAll}
            className="text-sm text-red-400 hover:text-red-600 cursor-pointer font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* ── Invoice table ─────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        {error ? (
          <p style={errorTextStyle}>{error}</p>
        ) : loading ? (
          <p style={mutedTextStyle}>Loading…</p>
        ) : displayed.length === 0 ? (
          <p style={mutedTextStyle}>No invoices found</p>
        ) : (
          <>
            {/* Active filter pill */}
            {filtersActive && (
              <span className="bg-[#EAF3DE] text-[#3B6D11] text-xs font-medium px-3 py-1 rounded-full inline-flex mb-3">
                {activeCount} active filter{activeCount !== 1 ? 's' : ''}
              </span>
            )}

            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['Farmer', 'Farmer ID', 'Date', 'DRC %', 'Total Litres', 'Total Amount', 'pH Status', 'TDS Status'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((invoice) => (
                    <tr key={invoice.id} style={trStyle}>

                      <td style={tdStyle}>{invoice.farmerName}</td>

                      <td style={tdStyle}>
                        <span className="text-sm font-mono text-gray-500">
                          {formatFarmerId(invoice.farmerId)}
                        </span>
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

            {/* Limit note — only shown when no filters are active and the full list exceeds the default cap */}
            {!filtersActive && sorted.length > DEFAULT_LIMIT && (
              <p style={limitNoteStyle}>
                Showing latest 25 records. Use filters to see more.
              </p>
            )}
          </>
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

const limitNoteStyle = {
  marginTop: '0.75rem',
  fontSize: '0.8rem',
  color: 'var(--color-text-muted)',
  textAlign: 'center',
}

export default InvoiceListPage
