import { useState, useRef }  from 'react'
import { useNavigate }        from 'react-router-dom'
import { useAuth }            from '../../contexts/AuthContext'
import { payBill }            from '../../services/billService'
import { uploadReceipt }      from '../../services/storageService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import '../expenses/Expenses.css'
import './Bills.css'

export default function PayBillSheet({ bill, onClose }) {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const fileRef  = useRef()

  const [form, setForm] = useState({
    amount:        String(bill.estimatedAmount),
    date:          bill.dueDate,
    paymentMethod: bill.paymentMethod ?? 'debit',
  })
  const [receipt, setReceipt]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError]       = useState('')

  function handle(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handlePay(e) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Ingresa el monto cobrado.'); return
    }
    if (!form.date) {
      setError('Ingresa la fecha de pago.'); return
    }

    setSaving(true)
    setError('')

    try {
      let receiptUrl = null
      if (receipt) {
        setProgress('Subiendo recibo...')
        try {
          receiptUrl = await uploadReceipt(user.id, receipt)
        } catch (uploadErr) {
          console.warn('Upload recibo falló:', uploadErr.message)
        }
        setProgress('')
      }

      // payBill: crea el expense con bill_id + avanza ciclo o marca pagada
      await payBill(user.id, bill, {
        amount:        form.amount,
        date:          form.date,
        paymentMethod: form.paymentMethod,
        receiptUrl,
      })

      // Ir a Gastos para que el usuario vea y pueda editar/eliminar el pago
      navigate('/gastos')
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago.')
      setSaving(false)
      setProgress('')
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '92dvh', overflowY: 'auto' }}>
        <div className="sheet-handle" />
        <h3>Registrar pago</h3>

        {/* Resumen de la factura */}
        <div className="pay-summary">
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>
            Valores estimados
          </p>
          <div className="pay-summary-row">
            <span>{bill.categoryIcon} {bill.name}</span>
            <span>{formatCurrency(bill.estimatedAmount)}</span>
          </div>
          <div className="pay-summary-row">
            <span>Fecha estimada</span>
            <span>{formatDate(bill.dueDate)}</span>
          </div>
          {bill.isRecurring && (
            <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
              🔄 La fecha avanzará al siguiente ciclo al confirmar.
            </p>
          )}
        </div>

        <form onSubmit={handlePay} className="sheet-form">

          <div className="field">
            <label>Monto cobrado</label>
            <div className="amount-input-wrap">
              <span>$</span>
              <input
                name="amount" type="number" inputMode="numeric" min="1"
                value={form.amount} onChange={handle}
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              Ajusta si fue diferente al estimado
            </p>
          </div>

          <div className="field">
            <label>Fecha de pago</label>
            <input name="date" type="date" value={form.date} onChange={handle} />
          </div>

          {/* Método de pago */}
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

          {/* Adjuntar recibo */}
          <div className="field">
            <label>Adjuntar recibo (opcional)</label>
            {!receipt ? (
              <label className="receipt-upload" htmlFor="receipt-file">
                <input
                  id="receipt-file" type="file" ref={fileRef}
                  accept="image/*,.pdf" onChange={e => setReceipt(e.target.files[0] ?? null)}
                />
                <span style={{ fontSize: '1.5rem' }}>📎</span>
                <p>Toca para adjuntar JPG, PNG o PDF</p>
              </label>
            ) : (
              <div className="receipt-preview">
                ✅ {receipt.name}
                <button
                  type="button"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
                  onClick={() => setReceipt(null)}
                >✕</button>
              </div>
            )}
          </div>

          {error    && <p className="sheet-error">{error}</p>}
          {progress && <p className="scan-hint">{progress}</p>}

          <div className="sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? (progress || 'Registrando...') : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
