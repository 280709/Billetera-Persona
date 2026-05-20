import { useState, useEffect }  from 'react'
import { useAuth }              from '../../contexts/AuthContext'
import { addSubscription }      from '../../services/subscriptionService'
import { useTRM }               from '../../hooks/useTRM'
import { usdToCOP }             from '../../services/trmService'
import { useCategories }        from '../../hooks/useCategories'
import { addCustomCategory }    from '../../services/categoryService'
import { formatCurrency }       from '../../utils/formatters'
import '../expenses/Expenses.css'
import '../bills/Bills.css'
import './Subscriptions.css'

const TODAY = new Date().toISOString().split('T')[0]

const INITIAL = {
  name:            '',
  currency:        'COP',
  amount:          '',
  billingCycle:    'monthly',
  nextBillingDate: '',
  reminderDays:    '3',
  isAutoDebit:     true,
  paymentMethod:   'debit',
}

export default function SubscriptionForm({ onClose }) {
  const { user }        = useAuth()
  const { trm }         = useTRM()
  const { categories }  = useCategories('subscription')
  const [form, setForm]         = useState(INITIAL)
  const [category, setCategory] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const estimatedCOP = form.currency === 'USD' && form.amount && trm
    ? usdToCOP(Number(form.amount), trm)
    : null

  function handle(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  async function handleAddCat() {
    if (!newCatName.trim()) return
    const doc = await addCustomCategory(user.uid, { name: newCatName, icon: '🏷️', type: 'subscription' })
    setCategory({ id: doc.id, label: newCatName, icon: '🏷️' })
    setAddingCat(false)
    setNewCatName('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())          { setError('Escribe el nombre.'); return }
    if (!category)                  { setError('Selecciona una categoría.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('El monto debe ser mayor a 0.'); return }
    if (!form.nextBillingDate)      { setError('Indica la próxima fecha de cobro.'); return }

    setSaving(true)
    try {
      await addSubscription(user.uid, {
        ...form,
        categoryId:    category.id,
        categoryLabel: category.label,
        categoryIcon:  category.icon,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '92dvh', overflowY: 'auto' }}>
        <div className="sheet-handle" />
        <h3>Nueva suscripción</h3>

        <form onSubmit={handleSubmit} className="sheet-form">
          <div className="field">
            <label>Nombre</label>
            <input
              name="name" type="text" autoFocus autoComplete="off"
              placeholder="Ej: Netflix, Spotify, Gym..."
              value={form.name} onChange={handle}
            />
          </div>

          {/* Categoría */}
          <div className="field">
            <label>Categoría</label>
            <div className="category-grid">
              {categories.map(cat => (
                <button
                  key={cat.id} type="button"
                  className={`category-option${category?.id === cat.id ? ' selected' : ''}`}
                  onClick={() => setCategory(cat)}
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

          {/* Moneda */}
          <div className="field">
            <label>Moneda</label>
            <div className="currency-toggle">
              {['COP', 'USD'].map(cur => (
                <button
                  key={cur} type="button"
                  className={`currency-btn${form.currency === cur ? ' active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, currency: cur }))}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div className="field">
            <label>Monto{form.currency === 'USD' ? ' (en dólares)' : ''}</label>
            <div className="amount-input-wrap">
              <span>{form.currency === 'USD' ? 'US$' : '$'}</span>
              <input
                name="amount" type="number" inputMode="decimal" min="0.01" step="0.01"
                placeholder="0"
                value={form.amount} onChange={handle}
              />
            </div>
          </div>

          {/* Preview COP si es USD */}
          {estimatedCOP && (
            <div className="trm-preview">
              <span>Estimado en pesos (TRM {trm?.toFixed(0)} + $200 margen)</span>
              <strong>≈ {formatCurrency(estimatedCOP)}</strong>
              <span>El banco puede variar según TRM del día del cobro</span>
            </div>
          )}

          <div className="field">
            <label>Frecuencia de cobro</label>
            <select name="billingCycle" value={form.billingCycle} onChange={handle}>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          <div className="field">
            <label>Próxima fecha de cobro</label>
            <input
              name="nextBillingDate" type="date"
              value={form.nextBillingDate} onChange={handle}
            />
          </div>

          <div className="field">
            <label>Recordarme (días antes)</label>
            <input
              name="reminderDays" type="number" inputMode="numeric"
              min="1" max="30" placeholder="3"
              value={form.reminderDays} onChange={handle}
            />
          </div>

          {/* Método de pago */}
          <div className="field">
            <label>Método de pago</label>
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
                Los cobros aparecerán en "Pendientes de TC" hasta que confirmes el pago de la tarjeta.
              </p>
            )}
          </div>

          <div className="toggle-row">
            <label>¿Débito automático?</label>
            <label className="toggle">
              <input name="isAutoDebit" type="checkbox" checked={form.isAutoDebit} onChange={handle} />
              <span className="toggle-slider" />
            </label>
          </div>

          {error && <p className="sheet-error">{error}</p>}

          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar suscripción'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
