import { useState }            from 'react'
import { useAuth }             from '../../contexts/AuthContext'
import { confirmSubscriptionDebit, advanceBillingCycle, addCreditCardCharge } from '../../services/subscriptionService'
import { useTRM }              from '../../hooks/useTRM'
import { usdToCOP }            from '../../services/trmService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import '../expenses/Expenses.css'
import './Subscriptions.css'

export default function ConfirmDebitSheet({ subscription: sub, onClose }) {
  const { user } = useAuth()
  const { trm }  = useTRM()

  const isUSD        = sub.currency === 'USD'
  const estimatedCOP = isUSD && trm ? usdToCOP(sub.amount, trm) : null

  const [realAmountCOP, setRealAmountCOP] = useState(
    isUSD ? (estimatedCOP ?? '') : sub.amount
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleConfirm() {
    setSaving(true)
    setError('')
    try {
      const confirmedAmount = Number(realAmountCOP) || (estimatedCOP ?? sub.amount)
      await confirmSubscriptionDebit(user.uid, sub.id, { realAmountCOP: confirmedAmount })

      // Avanzar al siguiente ciclo
      const nextDate = sub.nextBillingDate?.toDate?.() ?? new Date(sub.nextBillingDate)
      await advanceBillingCycle(user.uid, sub.id, nextDate, sub.billingCycle)

      // Si es tarjeta de crédito, crear cargo pendiente de TC
      if (sub.paymentMethod === 'credit') {
        await addCreditCardCharge(user.uid, {
          sourceType:  'subscription',
          sourceId:    sub.id,
          sourceName:  sub.name,
          categoryIcon: sub.categoryIcon,
          amount:      confirmedAmount,
          billingDate: nextDate,
        })
      }

      onClose()
    } catch {
      setError('No se pudo confirmar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <h3>Confirmar débito automático</h3>

        <div className="confirm-summary">
          <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            {sub.categoryIcon} {sub.name}
          </p>
          <p>
            <span>Fecha estimada</span>
            <span>{formatDate(sub.nextBillingDate)}</span>
          </p>
          <p>
            <span>Monto original</span>
            <span>
              {isUSD ? `US$ ${sub.amount.toFixed(2)}` : formatCurrency(sub.amount)}
            </span>
          </p>
          {isUSD && estimatedCOP && (
            <p>
              <span>Estimado COP (TRM {trm?.toFixed(0)} + $200)</span>
              <span>{formatCurrency(estimatedCOP)}</span>
            </p>
          )}
        </div>

        {/* Ajuste del monto real cobrado */}
        <div className="sheet-form" style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          <div className="field">
            <label>Monto real debitado (COP)</label>
            <div className="amount-input-wrap">
              <span>$</span>
              <input
                type="number" inputMode="numeric"
                value={realAmountCOP}
                onChange={e => setRealAmountCOP(e.target.value)}
                placeholder={estimatedCOP ?? sub.amount}
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              Ajusta si el banco cobró diferente al estimado
            </p>
          </div>

          {error && <p className="sheet-error">{error}</p>}

          <div className="sheet-actions">
            <button className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button className="btn-save" onClick={handleConfirm} disabled={saving}>
              {saving ? 'Confirmando...' : 'Confirmar débito'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
