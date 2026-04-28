import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { getFarmers, createFarmer, updateFarmer, deleteFarmer } from '../../api/farmerApi'
import { resetFarmerPasswordApi } from '../../api/authApi'

// Collection center ID is fixed at 1 for the current implementation.
const CENTER_ID = 1

// Empty form shape — reused when opening add and edit forms.
const EMPTY_FORM = { name: '', address: '', phoneNumber: '' }

function FarmerManagementPage() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  const [farmers,    setFarmers]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // 'none' | 'add' | 'edit' — which inline form is visible.
  const [mode,       setMode]       = useState('none')
  const [editingId,  setEditingId]  = useState(null)

  // Shared field state for both add and edit forms.
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formError,  setFormError]  = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // Fetch farmer list on mount.
  useEffect(() => {
    if (!isAuthenticated) return
    loadFarmers()
  }, [])

  // Safety-net redirect — ProtectedRoute handles this first in practice.
  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadFarmers() {
    setLoading(true)
    setError('')
    try {
      const data = await getFarmers(CENTER_ID)
      setFarmers(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load farmers.')
    } finally {
      setLoading(false)
    }
  }

  // ── Add form ───────────────────────────────────────────────────────────────

  function openAddForm() {
    setForm(EMPTY_FORM)
    setFormError('')
    setEditingId(null)
    setMode('add')
  }

  async function handleAddSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    setFormSaving(true)
    setFormError('')
    try {
      await createFarmer({ ...form, collectionCenterId: CENTER_ID })
      setMode('none')
      await loadFarmers()
    } catch {
      setFormError('Failed to add farmer.')
    } finally {
      setFormSaving(false)
    }
  }

  // ── Edit form ──────────────────────────────────────────────────────────────

  function openEditForm(farmer) {
    setForm({
      name:        farmer.name        ?? '',
      address:     farmer.address     ?? '',
      phoneNumber: farmer.phoneNumber ?? '',
    })
    setFormError('')
    setEditingId(farmer.id)
    setMode('edit')
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    setFormSaving(true)
    setFormError('')
    try {
      await updateFarmer(editingId, form)
      setMode('none')
      setEditingId(null)
      await loadFarmers()
    } catch {
      setFormError('Failed to update farmer.')
    } finally {
      setFormSaving(false)
    }
  }

  function cancelForm() {
    setMode('none')
    setEditingId(null)
    setFormError('')
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this farmer?')) return
    try {
      await deleteFarmer(id)
      await loadFarmers()
    } catch {
      alert('Failed to delete farmer.')
    }
  }

  // ── Reset password ─────────────────────────────────────────────────────────

  async function handleResetPassword(userId) {
    try {
      await resetFarmerPasswordApi(userId)
      alert('Password reset to 00000000')
    } catch {
      alert('Failed to reset password.')
    }
  }

  // ── Shared form field change handler ───────────────────────────────────────

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isFormOpen = mode === 'add' || mode === 'edit'

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>Farmer Management</h1>

      {/* ── "Add Farmer" button — hidden while the add form is open ────── */}
      {mode !== 'add' && (
        <div>
          <button onClick={openAddForm} style={addBtnStyle}>+ Add Farmer</button>
        </div>
      )}

      {/* ── Inline form (shared for add and edit) ───────────────────────── */}
      {isFormOpen && (
        <section style={formSectionStyle}>
          <h2 style={formTitleStyle}>{mode === 'add' ? 'Add Farmer' : 'Edit Farmer'}</h2>

          <form
            onSubmit={mode === 'add' ? handleAddSubmit : handleEditSubmit}
            style={formStyle}
          >
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                Name <span style={requiredMarkStyle}>*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                style={inputStyle}
                placeholder="Full name"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleFormChange}
                style={inputStyle}
                placeholder="Home address"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Phone Number</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleFormChange}
                style={inputStyle}
                placeholder="07X XXX XXXX"
              />
            </div>

            {formError && <p style={formErrorStyle}>{formError}</p>}

            <div style={formActionsStyle}>
              <button
                type="submit"
                disabled={formSaving}
                style={formSaving ? submitBtnDisabledStyle : submitBtnStyle}
              >
                {formSaving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={cancelForm} style={cancelBtnStyle}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Farmer list table ────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        {error ? (
          <p style={errorTextStyle}>{error}</p>
        ) : loading ? (
          <p style={mutedTextStyle}>Loading…</p>
        ) : farmers.length === 0 ? (
          <p style={mutedTextStyle}>No farmers found. Add one above.</p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Farmer Code', 'Name', 'Phone Number', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr key={farmer.id} style={trStyle}>

                    <td style={tdStyle}>{farmer.farmerCode}</td>
                    <td style={tdStyle}>{farmer.name}</td>
                    <td style={tdStyle}>{farmer.phoneNumber ?? '-'}</td>

                    <td style={tdStyle}>
                      <div style={actionCellStyle}>
                        {/* Pre-fills the edit form with this farmer's current data */}
                        <button
                          onClick={() => openEditForm(farmer)}
                          style={editBtnStyle}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(farmer.id)}
                          style={deleteBtnStyle}
                        >
                          Delete
                        </button>

                        {/* Resets the farmer's login password to the default value */}
                        <button
                          onClick={() => handleResetPassword(farmer.userId)}
                          style={resetBtnStyle}
                        >
                          Reset Password
                        </button>
                      </div>
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

const addBtnStyle = {
  padding: '0.55rem 1.1rem',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
}

const formSectionStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
}

const formTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: 'var(--color-text)',
  marginBottom: '1rem',
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  maxWidth: '480px',
}

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
}

const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--color-text)',
}

const requiredMarkStyle = {
  color: 'var(--color-danger)',
}

const inputStyle = {
  padding: '0.6rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9rem',
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  outline: 'none',
}

const formErrorStyle = {
  fontSize: '0.85rem',
  color: 'var(--color-danger)',
  margin: 0,
}

const formActionsStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '0.25rem',
}

// Base shared by submit and its disabled variant.
const btnBase = {
  padding: '0.55rem 1.1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: '600',
  border: 'none',
}

const submitBtnStyle = {
  ...btnBase,
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  cursor: 'pointer',
}

const submitBtnDisabledStyle = {
  ...btnBase,
  backgroundColor: 'var(--color-text-muted)',
  color: '#ffffff',
  cursor: 'not-allowed',
}

const cancelBtnStyle = {
  ...btnBase,
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
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

const actionCellStyle = {
  display: 'flex',
  gap: '0.4rem',
  flexWrap: 'wrap',
}

// Base shared by all three action button styles.
const actionBtnBase = {
  padding: '0.3rem 0.7rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.8rem',
  fontWeight: '500',
  cursor: 'pointer',
  backgroundColor: 'transparent',
}

const editBtnStyle = {
  ...actionBtnBase,
  color: 'var(--color-info)',
  border: '1px solid var(--color-info)',
}

const deleteBtnStyle = {
  ...actionBtnBase,
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
}

const resetBtnStyle = {
  ...actionBtnBase,
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
}

export default FarmerManagementPage
