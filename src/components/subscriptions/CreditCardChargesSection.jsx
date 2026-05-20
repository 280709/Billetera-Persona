import { useState }                    from 'react'
import { useAuth }                     from '../../contexts/AuthContext'
import { markCreditCardChargePaid, deleteCreditCardCharge } from '../../services/subscriptionService'
import { useCreditCardCharges }        from '../../hooks/useCreditCardCharges'
import { formatCurrency, formatDate }  from '../../utils/formatters'
import '../expenses/Expenses.css'
import './Subscriptions.css'

function ChargeRow({ charge }) {
  const { user }    = useAuth()
  const [paying, setPaying]       = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  async function handlePay() {
    setPaying(true)
    try {
      await markCreditCardChargePaid(user.uid, charge.id)
    } catch {
      setPaying(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteCreditCardCharge(user.uid, charge.id)
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const billingDate = charge.billingDate?.toDate?.() ?? (charge.billingDate ? new Date(charge.billingDate) : null)

  if (confirming) {
    return (
      <div className="cc-charge-row sub-confirm-row">
        <span className="sub-confirm-msg">¿Eliminar cargo de <strong>{charge.sourceName}</strong>?</span>
        <div className="sub-confirm-actions">
          <button className="btn-confirm-no" onClick={() => setConfirming(false)}>No</button>
          <button className="btn-confirm-yes" onClick={handleDelete} disabled={deleting}>
            {deleting ? '...' : 'Eliminar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cc-charge-row">
      <div className="sub-icon">{charge.categoryIcon}</div>

      <div className="sub-info">
        <div className="sub-name">
          {charge.sourceName}
          {charge.sourceType === 'bill' && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 99, background: '#fce7f3', color: '#9c27b0', marginLeft: 4 }}>
              Factura
            </span>
          )}
        </div>
        <div className="sub-meta">
          {billingDate ? `Cobrado ${formatDate(billingDate)}` : 'Pendiente de pago'}
        </div>
      </div>

      <div className="cc-charge-right">
        <span className="sub-amount">{formatCurrency(charge.amount)}</span>
        <div className="sub-actions" style={{ marginTop: '0.25rem' }}>
          <button
            className="btn-pay pay"
            style={{ fontSize: '0.72rem' }}
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? '...' : 'Pagado'}
          </button>
          <button
            className="btn-delete"
            aria-label="Eliminar cargo"
            onClick={() => setConfirming(true)}
          >
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreditCardChargesSection() {
  const { charges, totalPending, loading } = useCreditCardCharges()

  if (loading) return null
  if (charges.length === 0) return null

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="cc-section-header">
        <h3 className="cc-section-title">💳 Pendientes de tarjeta de crédito</h3>
        <span className="cc-total">{formatCurrency(totalPending)}</span>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
        Suscripciones cobradas a tu TC que aún no has pagado en el extracto.
      </p>

      {charges.map(charge => (
        <ChargeRow key={charge.id} charge={charge} />
      ))}
    </div>
  )
}
