import { useState }   from 'react'
import { useAuth }    from '../../contexts/AuthContext'
import { addBill, updateBill } from '../../services/billService'
import CategoryPicker from './CategoryPicker'
import '../expenses/Expenses.css'
import './Bills.css'

const RECURRENCE_OPTIONS = [
  { value: 'weekly',    label: 'Semanal' },
  { value: 'monthly',   label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly',    label: 'Anual' },
]

function buildInitial(bill) {
  if (bill) {
    return {
      name:             bill.name,
      estimatedAmount:  String(bill.estimatedAmount),
      dueDate:          bill.dueDate,
      paymentMethod:    bill.paymentMethod ?? 'debit',
      currency:         bill.currency ?? 'COP',
      reminderDays:     String(bill.reminderDays ?? 3),
      isRecurring:      Boolean(bill.isRecurring),
      recurrencePeriod: bill.recurrencePeriod ?? 'monthly',
    }
  }
  return {
    name:             '',
    estimatedAmount:  '',
    dueDate:          '',
    paymentMethod:    'debit',
    currency:         'COP',
    reminderDays:     '3',
    isRecurring:      false,
    recurrencePeriod: 'monthly',
  }
}

// bill prop: si se pasa, el formulario opera en modo edición
export default function BillForm({ onClose, bill = null }) {
  const { user }            = useAuth()
  const isEditing           = bill !== null
  const [form, setForm]     = useState(() => buildInitial(bill))
  const [category, setCategory] = useState(
    bill ? { id: bill.categoryId, label: bill.categoryLabel, icon: bill.categoryIcon } : null
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function handle(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())       { setError('Escribe el nombre de la factura.'); return }
    if (!category)               { setError('Selecciona una categoría.'); return }
    if (!form.estimatedAmount || Number(form.estimatedAmount) <= 0) {
      setError('El monto estimado debe ser mayor a 0.'); return
    }
    if (!form.dueDate) { setError('Indica la fecha de vencimiento.'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        categoryId:    category.id,
        categoryLabel: category.label,
        categoryIcon:  category.icon,
      }
      if (isEditing) {
        await updateBill(user.id, bill.id, payload)
      } else {
        await addBill(user.id, payload)
      }
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
        <h3>{isEditing ? 'Editar factura' : 'Nueva factura'}</h3>

        <form onSubmit={handleSubmit} className="sheet-form">

          <div className="field">
            <label>Nombre</label>
            <input
              name="name" type="text" autoFocus autoComplete="off"
              placeholder="Ej: Electricidad, Netflix, Arriendo..."
              value={form.name} onChange={handle}
            />
          </div>

          <div className="field">
            <label>Categoría</label>
            <CategoryPicker type="bill" value={category} onChange={setCategory} />
          </div>

          {/* Monto + moneda */}
          <div className="field">
            <label>Monto estimado</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="currency-toggle" style={{ flexShrink: 0 }}>
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
              <div className="amount-input-wrap" style={{ flex: 1 }}>
                <span>{form.currency === 'USD' ? 'US$' : '$'}</span>
                <input
                  name="estimatedAmount" type="number" inputMode="numeric" min="1"
                  placeholder="0"
                  value={form.estimatedAmount} onChange={handle}
                />
              </div>
            </div>
            {form.currency === 'USD' && (
              <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                Se convertirá a COP usando la TRM del día al calcular el presupuesto.
              </p>
            )}
          </div>

          <div className="field">
            <label>Fecha de vencimiento</label>
            <input
              name="dueDate" type="date"
              value={form.dueDate} onChange={handle}
            />
          </div>

          {/* Método de pago */}
          <div className="field">
            <label>Método de pago habitual</label>
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

          <div className="field">
            <label>Recordarme con anticipación (días)</label>
            <input
              name="reminderDays" type="number" inputMode="numeric"
              min="1" max="30" placeholder="3"
              value={form.reminderDays} onChange={handle}
            />
          </div>

          {/* Recurrencia */}
          <div className="recurrence-block">
            <div className="toggle-row" style={{ marginBottom: form.isRecurring ? '0.75rem' : 0 }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)' }}>
                  🔄 Repetir al pagar
                </span>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>
                  {form.isRecurring
                    ? 'La fecha avanzará automáticamente al registrar el pago'
                    : 'Actívalo para facturas fijas (luz, agua, Netflix…)'}
                </p>
              </div>
              <label className="toggle">
                <input name="isRecurring" type="checkbox" checked={form.isRecurring} onChange={handle} />
                <span className="toggle-slider" />
              </label>
            </div>

            {form.isRecurring && (
              <div className="recurrence-chips">
                {RECURRENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value} type="button"
                    className={`recurrence-chip${form.recurrencePeriod === opt.value ? ' selected' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, recurrencePeriod: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="sheet-error">{error}</p>}

          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar factura'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
