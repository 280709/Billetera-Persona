import { useState }           from 'react'
import { useAuth }            from '../../contexts/AuthContext'
import { addExpense }         from '../../services/expenseService'
import { uploadReceipt }      from '../../services/storageService'
import { addCreditCardCharge } from '../../services/subscriptionService'
import { useCategories }      from '../../hooks/useCategories'
import { addCustomCategory }  from '../../services/categoryService'
import InvoiceScanner         from './InvoiceScanner'
import '../expenses/Expenses.css'
import '../subscriptions/Subscriptions.css'
import '../bills/Bills.css'

const TODAY = new Date().toISOString().split('T')[0]

const INITIAL = {
  description:   '',
  amount:        '',
  date:          TODAY,
  paymentMethod: 'debit',
}

export default function ExpenseForm({ onClose }) {
  const { user }       = useAuth()
  const { categories } = useCategories('expense')

  const [form, setForm]             = useState(INITIAL)
  const [category, setCategory]     = useState(null)
  const [capturedFile, setCapturedFile] = useState(null)  // archivo imagen del scanner
  const [saving, setSaving]         = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError]           = useState('')
  const [addingCat, setAddingCat]   = useState(false)
  const [newCatName, setNewCatName] = useState('')

  function handle(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  // Recibe resultado de la IA + archivo de imagen
  function handleScanResult({ description, amount, date, categoryId, paymentMethod, imageFile } = {}) {
    setForm(prev => ({
      ...prev,
      description:   description   ?? prev.description,
      amount:        amount        ?? prev.amount,
      date:          date          ?? prev.date,
      paymentMethod: paymentMethod ?? prev.paymentMethod,
    }))

    // Auto-seleccionar categoría si la IA la detectó
    if (categoryId) {
      const match = categories.find(c => c.id === categoryId)
      if (match) setCategory(match)
    }

    // Guardar archivo para subirlo al guardar
    if (imageFile) setCapturedFile(imageFile)

    setError('')
  }

  async function handleAddCat() {
    if (!newCatName.trim()) return
    const ref = await addCustomCategory(user.uid, { name: newCatName, icon: '🏷️', type: 'expense' })
    setCategory({ id: ref.id, label: newCatName, icon: '🏷️' })
    setAddingCat(false)
    setNewCatName('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.description.trim())                   { setError('Ingresa una descripción.'); return }
    if (!category)                                  { setError('Selecciona una categoría.'); return }
    if (!form.amount || Number(form.amount) <= 0)   { setError('El monto debe ser mayor a 0.'); return }

    setSaving(true)
    setError('')

    try {
      // 1. Subir imagen del recibo si hay una capturada
      let receiptUrl = null
      if (capturedFile) {
        setUploadProgress('Subiendo recibo...')
        try {
          receiptUrl = await uploadReceipt(user.uid, capturedFile)
        } catch (uploadErr) {
          console.warn('No se pudo subir el recibo:', uploadErr.message)
          // No bloquear el guardado si falla el upload
        }
        setUploadProgress('')
      }

      // 2. Guardar el gasto con la URL del recibo
      await addExpense(user.uid, {
        ...form,
        categoryId:    category.id,
        categoryLabel: category.label,
        categoryIcon:  category.icon,
        receiptUrl,
      })

      // 3. Si pagó con TC, crear cargo pendiente
      if (form.paymentMethod === 'credit') {
        await addCreditCardCharge(user.uid, {
          sourceType:  'expense',
          sourceId:    null,
          sourceName:  form.description,
          categoryIcon: category.icon,
          amount:      form.amount,
          billingDate: form.date,
        })
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
        <h3>Nuevo gasto</h3>

        <form onSubmit={handleSubmit} className="sheet-form">

          {/* Scanner IA — aparece solo si el usuario configuró Gemini */}
          <InvoiceScanner onResult={handleScanResult} />

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

          {/* Categoría — puede venir pre-seleccionada por la IA */}
          <div className="field">
            <label>
              Categoría
              {category && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>✓ detectada por IA</span>}
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
              value={form.date} onChange={handle} max={TODAY}
            />
          </div>

          {/* Método de pago — puede venir pre-seleccionado por la IA */}
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
            {form.paymentMethod === 'credit' && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
                Se creará un cargo pendiente en "Tarjeta de crédito".
              </p>
            )}
          </div>

          {/* Indicador de recibo adjunto */}
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

          {error && <p className="sheet-error">{error}</p>}
          {uploadProgress && <p className="scan-hint">{uploadProgress}</p>}

          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? (uploadProgress || 'Guardando...') : 'Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
