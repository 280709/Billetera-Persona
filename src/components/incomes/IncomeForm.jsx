import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { addRecurringIncome, addOccasionalIncome } from '../../services/incomeService'
import '../expenses/Expenses.css'
import './Incomes.css'

const TODAY           = new Date().toISOString().split('T')[0]
const FIRST_OF_MONTH  = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                          .toISOString().split('T')[0]
const DAYS            = Array.from({ length: 31 }, (_, i) => i + 1)

function DayPicker({ selected, onChange, max }) {
  function toggle(day) {
    if (selected.includes(day)) {
      onChange(selected.filter(d => d !== day))
    } else if (selected.length < max) {
      onChange([...selected, day].sort((a, b) => a - b))
    }
  }

  return (
    <div>
      <span className="day-picker-label">
        {max === 1 ? '¿Qué día del mes recibes el pago?' : '¿Qué días del mes recibes el pago?'}
      </span>
      <p className="day-picker-hint">
        {max === 1
          ? <>Selecciona <span>1 día</span></>
          : <>Selecciona hasta <span>{max} días</span> · elegidos: <span>{selected.length}</span></>
        }
      </p>
      <div className="day-grid">
        {DAYS.map(day => {
          const isSelected = selected.includes(day)
          const isDisabled = !isSelected && selected.length >= max
          return (
            <button
              key={day}
              type="button"
              className={`day-btn${isSelected ? ' day-selected' : ''}${isDisabled ? ' day-disabled' : ''}`}
              onClick={() => toggle(day)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function IncomeForm({ onClose }) {
  const { user }  = useAuth()
  const [type, setType]       = useState('recurring')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const [recurring, setRecurring] = useState({
    description:   '',
    amount:        '',
    timesPerMonth: '1',
    payDays:       [],
    startDate:     FIRST_OF_MONTH,
  })

  const [occasional, setOccasional] = useState({
    description: '',
    amount:      '',
    date:        TODAY,
  })

  const maxDays = Math.max(1, Math.min(31, Number(recurring.timesPerMonth) || 1))

  function handleRecurring(e) {
    const { name, value } = e.target
    setRecurring(prev => ({
      ...prev,
      [name]: value,
      // Al cambiar cuántas veces, limpiar días si hay más seleccionados de los permitidos
      ...(name === 'timesPerMonth'
        ? { payDays: prev.payDays.slice(0, Number(value) || 1) }
        : {}),
    }))
    setError('')
  }

  function handleOccasional(e) {
    setOccasional(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (type === 'recurring') {
      if (!recurring.description.trim())          { setError('Escribe una descripción.'); return }
      if (!recurring.amount || Number(recurring.amount) <= 0) { setError('El monto debe ser mayor a 0.'); return }
      if (recurring.payDays.length === 0) { setError('Selecciona al menos un día de pago.'); return }
      if (recurring.payDays.length < maxDays) {
        setError(`Selecciona exactamente ${maxDays} día${maxDays > 1 ? 's' : ''} de pago.`)
        return
      }
    } else {
      if (!occasional.description.trim())          { setError('Escribe una descripción.'); return }
      if (!occasional.amount || Number(occasional.amount) <= 0) { setError('El monto debe ser mayor a 0.'); return }
    }

    setSaving(true)
    try {
      if (type === 'recurring') {
        await addRecurringIncome(user.uid, recurring)
      } else {
        await addOccasionalIncome(user.uid, occasional)
      }
      onClose()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
        <div className="sheet-handle" />
        <h3>Nuevo ingreso</h3>

        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn ${type === 'recurring' ? 'active' : ''}`}
            onClick={() => setType('recurring')}
          >
            💰 Fijo
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'occasional' ? 'active' : ''}`}
            onClick={() => setType('occasional')}
          >
            ⚡ Adicional
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sheet-form">
          {type === 'recurring' ? (
            <>
              <div className="field">
                <label>Descripción</label>
                <input
                  name="description"
                  type="text"
                  autoComplete="off"
                  placeholder="Ej: Salario, Arriendo recibido..."
                  value={recurring.description}
                  onChange={handleRecurring}
                />
              </div>

              <div className="field">
                <label>Monto por pago</label>
                <div className="amount-input-wrap">
                  <span>$</span>
                  <input
                    name="amount"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="0"
                    value={recurring.amount}
                    onChange={handleRecurring}
                  />
                </div>
              </div>

              <div className="field">
                <label>¿Cuántas veces al mes lo recibes?</label>
                <input
                  name="timesPerMonth"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  placeholder="Ej: 1 mensual · 2 quincenal · 4 semanal"
                  value={recurring.timesPerMonth}
                  onChange={handleRecurring}
                />
              </div>

              <div className="field">
                <label>¿Desde cuándo recibes este ingreso?</label>
                <input
                  name="startDate"
                  type="date"
                  value={recurring.startDate}
                  max={TODAY}
                  onChange={handleRecurring}
                />
              </div>

              <DayPicker
                selected={recurring.payDays}
                onChange={payDays => setRecurring(prev => ({ ...prev, payDays }))}
                max={maxDays}
              />
            </>
          ) : (
            <>
              <div className="field">
                <label>Descripción</label>
                <input
                  name="description"
                  type="text"
                  autoComplete="off"
                  placeholder="Ej: Freelance, Bono, Venta..."
                  value={occasional.description}
                  onChange={handleOccasional}
                />
              </div>

              <div className="field">
                <label>Monto recibido</label>
                <div className="amount-input-wrap">
                  <span>$</span>
                  <input
                    name="amount"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="0"
                    value={occasional.amount}
                    onChange={handleOccasional}
                  />
                </div>
              </div>

              <div className="field">
                <label>Fecha en que lo recibiste</label>
                <input
                  name="date"
                  type="date"
                  value={occasional.date}
                  max={TODAY}
                  onChange={handleOccasional}
                />
              </div>
            </>
          )}

          {error && <p className="sheet-error">{error}</p>}

          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar ingreso'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
