import { useState }          from 'react'
import { useAuth }           from '../../contexts/AuthContext'
import { addExpense, updateExpense } from '../../services/expenseService'
import { uploadReceipt }     from '../../services/storageService'
import { useCategories }     from '../../hooks/useCategories'
import { addCustomCategory } from '../../services/categoryService'
import InvoiceScanner        from './InvoiceScanner'
import '../expenses/Expenses.css'
import '../subscriptions/Subscriptions.css'
import '../bills/Bills.css'

const TODAY = new Date().toISOString().split('T')[0]

function buildInitial(expense) {
  if (expense) {
    return {
      description:   expense.description,
      amount:        String(expense.amount),
      date:          expense.date,
      paymentMethod: expense.paymentMethod ?? 'debit',
    }
  }
  return { description: '', amount: '', date: TODAY, paymentMethod: 'debit' }
}

// expense prop: si se pasa, opera en modo edición
export default function ExpenseForm({ onClose, expense = null }) {
  const { user }       = useAuth()
  const { categories } = useCategories('expense')
  const isEditing      = expense !== null

  const [form, setForm]         = useState(() => buildInitial(expense))
  const [category, setCategory] = useState(
    expense ? { id: expense.categoryId, label: expense.categoryLabel, icon: expense.categoryIcon } : null
  )
  const [capturedFile, setCapturedFile]     = useState(null)
  const [saving, setSaving]                 = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError]                   = useState('')
  const [addingCat, setAddingCat]           = useState(false)
  const [newCatName, setNewCatName]         = useState('')

  function handle(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  function handleScanResult({ description, amount, date, categoryId, paymentMethod, imageFile } = {}) {
    setForm(prev => ({
      ...prev,
      description:   description   ?? prev.description,
      amount:        amount        ?? prev.amount,
      date:          date          ?? prev.date,
      paymentMethod: paymentMethod ?? prev.paymentMethod,
    }))
    if (categoryId) {
      const match = categories.find(c => c.id === categoryId)
      if (match) setCategory(match)
    }
    if (imageFile) setCapturedFile(imageFile)
    setError('')
  }

  async function handleAddCat() {
    if (!newCatName.trim()) return
    const ref = await addCustomCategory(user.id, { name: newCatName, icon: '🏷️', type: 'expense' })
    setCategory({ id: ref.id, label: newCatName, icon: '🏷️' })
    setAddingCat(false)
    setNewCatName('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.description.trim())                 { setError('Ingresa una descripción.'); return }
    if (!category)                                { setError('Selecciona una categoría.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('El monto debe ser mayor a 0.'); return }

    setSaving(true)
    setError('')

    try {
      let receiptUrl = expense?.receiptUrl ?? null

      if (capturedFile) {
        setUploadProgress('Subiendo recibo...')
        try {
          receiptUrl = await uploadReceipt(user.id, capturedFile)
        } catch (uploadErr) {
          console.warn('No se pudo subir el recibo:', uploadErr.message)
        }
        setUploadProgress('')
      }

      const payload = {
        ...form,
        categoryId:    category.id,
        categoryLabel: category.label,
        categoryIcon:  category.icon,
        receiptUrl,
      }

      if (isEditing) {
        await updateExpense(user.id, expense.id, payload)
      } else {
        await addExpense(user.id, payload)
      }

      onClose()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
      setUploadProgress('')
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '92dvh', overflowY: 'auto' }}>
        <div className="sheet-handle" />
        <h3>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</h3>

        {isEditing && expense.billId && (
          <div style={{
            background: '#e8f0fe', borderRadius: '0.6rem',
            padding: '0.5rem 0.75rem', fontSize: '0.82rem',
            color: '#1a73e8', marginBottom: '0.5rem',
          }}>
            📋 Pago de factura — edita el monto o fecha si hubo un error
          </div>
        )}

        <form onSubmit={handleSubmit} className="sheet-form">

          {/* Scanner IA — solo para gastos nuevos */}
          {!isEditing && <InvoiceScanner onResult={handleScanResult} />}

          <div className="field">
            <label>Descripción</label>
            <input
              name="description" type="text" autoFocus autoComplete="off"
              placeholder="Ej: Mercado, Uber, Almuerzo..."
              value={form.description} onChange={handle}
            />
          </div>

          <div className="field">
            <label>Monto</label>
            <div className="amount-input-wrap">
              <span>$</span>
              <input
                name="amount" type="number" inputMode="numeric" min="1"
                placeholder="0"
                value={form.amount} onChange={handle}
              />
            </div>
          </div>

          <div className="field">
            <label>
              Categoría
              {!isEditing && category && (
                <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ detectada por IA
                </span>
              )}
            </label>
            <div className="category-grid">
              {categories.map(cat => (
                <button
                  key={cat.id} type="button"
                  className={`category-option${category?.id === cat.id ? ' selected' : ''}`}
                  onClick={() => { setCategory(cat); setError('') }}
                >
                  <span>{cat.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.label}
                  </span>
                </button>
              ))}
              <button type="button" className="category-option add-new" onClick={() => setAddingCat(v => !v)}>
                + Nueva
              </button>
            </div>
            {addingCat && (
              <div className="new-cat-form">
                <input
                  type="text" placeholder="Nombre..." value={newCatName} autoFocus
                  onChange={e => setNewCatName(e.target.value)} maxLength={30}
                />
                <button type="button" className="btn-add-cat" onClick={handleAddCat}>OK</button>
              </div>
            )}
          </div>

          <div className="field">
            <label>Fecha</label>
            <input
              name="date" type="date"
              value={form.date} onChange={handle}
            />
          </div>

          <div className="field">
            <label>Pagado con</label>
            <div className="currency-toggle">
              {[
                { val: 'debit',  label: '🏦 Débito' },
                { val: 'credit', label: '💳 Crédito' },
              ].map(({ val, label }) => (
                <button
                  key={val} type="button"
                  className={`currency-btn${form.paymentMethod === val ? ' active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, paymentMethod: val }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recibo adjunto */}
          {expense?.receiptUrl && !capturedFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#e8f5e9', borderRadius: '0.6rem',
              padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#2e7d32',
            }}>
              <span>📎</span>
              <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                Ver recibo adjunto
              </a>
            </div>
          )}

          {capturedFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#e8f5e9', borderRadius: '0.6rem',
              padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#2e7d32',
            }}>
              <span>📎</span>
              <span>Recibo adjunto — se guardará con el gasto</span>
              <button
                type="button"
                onClick={() => setCapturedFile(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#999' }}
              >✕</button>
            </div>
          )}

          {error          && <p className="sheet-error">{error}</p>}
          {uploadProgress && <p className="scan-hint">{uploadProgress}</p>}

          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? (uploadProgress || 'Guardando...') : isEditing ? 'Guardar cambios' : 'Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
