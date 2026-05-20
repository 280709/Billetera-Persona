import { useState }       from 'react'
import { useAuth }        from '../../contexts/AuthContext'
import { addBill }        from '../../services/billService'
import CategoryPicker     from './CategoryPicker'
import '../expenses/Expenses.css'
import './Bills.css'

const TODAY = new Date().toISOString().split('T')[0]

const INITIAL = {
  name:              '',
  estimatedAmount:   '',
  estimatedDueDate:  '',
  reminderDays:      '3',
  isAutoDebit:       false,
  isRecurring:       false,
  recurrencePeriod:  'monthly',
}

export default function BillForm({ onClose }) {
  const { user } = useAuth()
  const [form, setForm]       = useState(INITIAL)
  const [category, setCategory] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  function handle(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())         { setError('Escribe el nombre de la factura.'); return }
    if (!category)                 { setError('Selecciona una categoría.'); return }
    if (!form.estimatedAmount || Number(form.estimatedAmount) <= 0) {
      setError('El monto estimado debe ser mayor a 0.'); return
    }
    if (!form.estimatedDueDate)    { setError('Indica la fecha estimada de vencimiento.'); return }

    setSaving(true)
    try {
      await addBill(user.uid, {
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
        <h3>Nueva factura</h3>

        <form onSubmit={handleSubmit} className="sheet-form">
          <div className="field">
            <label>Nombre</label>
            <input
              name="name" type="text" autoFocus autoComplete="off"
              placeholder="Ej: Electricidad EPM, Agua..."
              value={form.name} onChange={handle}
            />
          </div>

          <div className="field">
            <label>Categoría</label>
            <CategoryPicker type="bill" value={category} onChange={setCategory} />
          </div>

          <div className="field">
            <label>Monto estimado</label>
            <div className="amount-input-wrap">
              <span>$</span>
              <input
                name="estimatedAmount" type="number" inputMode="numeric" min="1"
                placeholder="0 — puedes ajustar al pagar"
                value={form.estimatedAmount} onChange={handle}
              />
            </div>
          </div>

          <div className="field">
            <label>Fecha estimada de vencimiento</label>
            <input
              name="estimatedDueDate" type="date"
              value={form.estimatedDueDate} onChange={handle}
            />
          </div>

          <div className="field">
            <label>Recordarme con anticipación (días)</label>
            <input
              name="reminderDays" type="number" inputMode="numeric"
              min="1" max="30" placeholder="3"
              value={form.reminderDays} onChange={handle}
            />
          </div>

          <div className="toggle-row">
            <label>¿Débito automático?</label>
            <label className="toggle">
              <input name="isAutoDebit" type="checkbox" checked={form.isAutoDebit} onChange={handle} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="toggle-row">
            <label>¿Se repite cada mes?</label>
            <label className="toggle">
              <input name="isRecurring" type="checkbox" checked={form.isRecurring} onChange={handle} />
              <span className="toggle-slider" />
            </label>
          </div>

          {form.isRecurring && (
            <div className="field">
              <label>Frecuencia</label>
              <select name="recurrencePeriod" value={form.recurrencePeriod} onChange={handle}>
                <option value="monthly">Mensual</option>
                <option value="bimonthly">Bimestral</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          )}

          {error && <p className="sheet-error">{error}</p>}

          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar factura'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
