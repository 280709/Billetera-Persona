import { useState, useRef }   from 'react'
import { useAuth }             from '../../contexts/AuthContext'
import { payBill, createNextCycle, confirmDebit } from '../../services/billService'
import { addCreditCardCharge } from '../../services/subscriptionService'
import { uploadReceipt }       from '../../services/storageService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import '../expenses/Expenses.css'
import './Bills.css'
import '../subscriptions/Subscriptions.css'

export default function PayBillSheet({ bill, onClose }) {
  const { user }  = useAuth()
  const fileRef   = useRef()

  const estDate  = bill.estimatedDueDate?.toDate?.() ?? new Date(bill.estimatedDueDate)
  const estDateStr = estDate.toISOString().split('T')[0]

  const [form, setForm] = useState({
    realAmount:    bill.estimatedAmount,
    realDueDate:   estDateStr,
    paymentMethod: 'debit',
  })
  const [receipt, setReceipt]     = useState(null)   // File object
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [step, setStep]           = useState('form') // 'form' | 'confirm_debit'

  function handle(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (file) setReceipt(file)
  }

  // Para débitos automáticos: primero confirmar, luego pagar
  async function handleConfirmDebit() {
    setSaving(true)
    try {
      await confirmDebit(user.uid, bill.id)
      setStep('form')
    } catch {
      setError('No se pudo confirmar.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePay(e) {
    e.preventDefault()
    if (!form.realAmount || Number(form.realAmount) <= 0) {
      setError('Ingresa el monto real cobrado.'); return
    }
    if (!form.realDueDate) {
      setError('Ingresa la fecha real de pago.'); return
    }

    setSaving(true)
    setError('')
    try {
      let receiptUrl = null
      if (receipt) {
        try {
          receiptUrl = await uploadReceipt(user.uid, receipt)
        } catch (uploadErr) {
          setError(`Recibo: ${uploadErr.message} — ¿Continuar sin adjunto?`)
          // Permite continuar sin el recibo si hay error de Storage
        }
      }

      await payBill(user.uid, bill.id, {
        realAmount:  form.realAmount,
        realDueDate: form.realDueDate,
        receiptUrl,
      })

      // Si pagó con TC, crear cargo pendiente
      if (form.paymentMethod === 'credit') {
        await addCreditCardCharge(user.uid, {
          sourceType:  'bill',
          sourceId:    bill.id,
          sourceName:  bill.name,
          categoryIcon: bill.categoryIcon,
          amount:      form.realAmount,
          billingDate: form.realDueDate,
        })
      }

      // Crear ciclo siguiente para recurrentes
      if (bill.isRecurring) await createNextCycle(user.uid, bill)

      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '92dvh', overflowY: 'auto' }}>
        <div className="sheet-handle" />

        {/* ── Vista: confirmar débito automático ── */}
        {bill.isAutoDebit && !bill.debitConfirmed && step === 'confirm_debit' ? (
          <>
            <h3>Confirmar débito automático</h3>
            <div className="pay-summary">
              <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                {bill.categoryIcon} {bill.name}
              </p>
              <div className="pay-summary-row">
                <span>Monto estimado</span>
                <span>{formatCurrency(bill.estimatedAmount)}</span>
              </div>
              <div className="pay-summary-row">
                <span>Vencimiento estimado</span>
                <span>{formatDate(bill.estimatedDueDate)}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
              ¿El banco ya realizó el débito? Confirma para luego registrar el monto y fecha reales.
            </p>
            {error && <p className="sheet-error">{error}</p>}
            <div className="sheet-actions">
              <button className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button className="btn-save" onClick={handleConfirmDebit} disabled={saving}>
                {saving ? 'Confirmando...' : 'Sí, fue debitado'}
              </button>
            </div>
          </>
        ) : (
          /* ── Vista: registrar pago real ── */
          <>
            <h3>Registrar pago real</h3>

            {/* Resumen del estimado */}
            <div className="pay-summary">
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>
                Valores estimados
              </p>
              <div className="pay-summary-row">
                <span>Monto estimado</span>
                <span>{formatCurrency(bill.estimatedAmount)}</span>
              </div>
              <div className="pay-summary-row">
                <span>Fecha estimada</span>
                <span>{formatDate(bill.estimatedDueDate)}</span>
              </div>
            </div>

            <form onSubmit={handlePay} className="sheet-form">
              <div className="field">
                <label>Monto real cobrado</label>
                <div className="amount-input-wrap">
                  <span>$</span>
                  <input
                    name="realAmount" type="number" inputMode="numeric" min="1"
                    value={form.realAmount} onChange={handle}
                  />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                  Actualiza si fue diferente al estimado
                </p>
              </div>

              <div className="field">
                <label>Fecha real de pago</label>
                <input
                  name="realDueDate" type="date"
                  value={form.realDueDate} onChange={handle}
                />
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
                {form.paymentMethod === 'credit' && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.35rem' }}>
                    Se creará un cargo pendiente en "Tarjeta de crédito".
                  </p>
                )}
              </div>

              {/* Adjuntar recibo */}
              <div className="field">
                <label>Adjuntar recibo (opcional)</label>
                {!receipt ? (
                  <label className="receipt-upload" htmlFor="receipt-file">
                    <input
                      id="receipt-file" type="file" ref={fileRef}
                      accept="image/*,.pdf" onChange={handleFile}
                    />
                    <span style={{ fontSize: '1.5rem' }}>📎</span>
                    <p>Toca para adjuntar JPG, PNG o PDF (máx 5 MB)</p>
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

              {error && <p className="sheet-error">{error}</p>}

              <div className="sheet-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Registrando...' : 'Registrar pago'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  )
}
