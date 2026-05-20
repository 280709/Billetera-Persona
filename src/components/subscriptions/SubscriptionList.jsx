import { useState }            from 'react'
import { useAuth }             from '../../contexts/AuthContext'
import { deactivateSubscription } from '../../services/subscriptionService'
import { useTRM }              from '../../hooks/useTRM'
import { usdToCOP }            from '../../services/trmService'
import { formatCurrency, formatDate, daysUntil } from '../../utils/formatters'
import ConfirmDebitSheet       from './ConfirmDebitSheet'
import '../expenses/Expenses.css'
import './Subscriptions.css'

const CYCLE_LABEL = { monthly: 'Mensual', yearly: 'Anual', weekly: 'Semanal' }

function SubRow({ sub, trm, onConfirm }) {
  const { user }        = useAuth()
  const isUSD           = sub.currency === 'USD'
  const estimatedCOP    = isUSD && trm ? usdToCOP(sub.amount, trm) : null
  const days            = daysUntil(sub.nextBillingDate)
  const needsConfirm    = !sub.currentCycleConfirmed && days <= (sub.reminderDays ?? 3)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  async function handleDeactivate() {
    setDeleting(true)
    try {
      await deactivateSubscription(user.uid, sub.id)
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  // Vista de confirmación de cancelación
  if (confirming) {
    return (
      <div className="sub-row sub-confirm-row">
        <span className="sub-confirm-msg">¿Cancelar <strong>{sub.name}</strong>?</span>
        <div className="sub-confirm-actions">
          <button className="btn-confirm-no" onClick={() => setConfirming(false)}>No</button>
          <button className="btn-confirm-yes" onClick={handleDeactivate} disabled={deleting}>
            {deleting ? '...' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sub-row">
      <div className="sub-icon">{sub.categoryIcon ?? '📦'}</div>

      <div className="sub-info">
        <div className="sub-name">
          {sub.name}
          {isUSD && <span className="usd-badge">USD</span>}
          {sub.paymentMethod === 'credit' && <span className="pm-badge credit">TC</span>}
          {needsConfirm && <span className="confirm-badge">⚠ Confirmar</span>}
        </div>
        <div className="sub-meta">
          {sub.categoryLabel} · {CYCLE_LABEL[sub.billingCycle] ?? sub.billingCycle}
          · Próximo {formatDate(sub.nextBillingDate)}
        </div>
      </div>

      <div className="sub-right">
        <div>
          <div className="sub-amount">
            {isUSD ? `US$ ${sub.amount.toFixed(2)}` : formatCurrency(sub.amount)}
          </div>
          {estimatedCOP && (
            <div className="sub-amount-cop">≈ {formatCurrency(estimatedCOP)}</div>
          )}
        </div>
        <div className="sub-actions">
          {needsConfirm && (
            <button className="btn-pay pay" style={{ fontSize: '0.72rem' }} onClick={() => onConfirm(sub)}>
              Confirmar
            </button>
          )}
          <button
            className="btn-delete"
            aria-label="Cancelar suscripción"
            onClick={() => setConfirming(true)}
          >
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionList({ subscriptions, loading }) {
  const { trm }             = useTRM()
  const [confirming, setConfirming] = useState(null)

  if (loading) return (
    <div className="card">
      {[1, 2].map(i => (
        <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 8 }} />
      ))}
    </div>
  )

  if (subscriptions.length === 0) return (
    <div className="card">
      <p className="empty-hint">Sin suscripciones activas. Pulsa + para agregar.</p>
    </div>
  )

  return (
    <>
      <div className="card">
        {subscriptions.map(sub => (
          <SubRow key={sub.id} sub={sub} trm={trm} onConfirm={setConfirming} />
        ))}
      </div>

      {confirming && (
        <ConfirmDebitSheet subscription={confirming} onClose={() => setConfirming(null)} />
      )}
    </>
  )
}
