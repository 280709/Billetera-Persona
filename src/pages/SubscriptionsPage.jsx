import { useState }                    from 'react'
import Layout                          from '../components/layout/Layout'
import SubscriptionList                from '../components/subscriptions/SubscriptionList'
import SubscriptionForm                from '../components/subscriptions/SubscriptionForm'
import CreditCardChargesSection        from '../components/subscriptions/CreditCardChargesSection'
import { useSubscriptions }            from '../hooks/useSubscriptions'
import { useCreditCardCharges }        from '../hooks/useCreditCardCharges'
import { useTRM }                      from '../hooks/useTRM'
import { usdToCOP }                    from '../services/trmService'
import { formatCurrency }              from '../utils/formatters'
import '../components/layout/Layout.css'
import '../components/expenses/Expenses.css'
import '../components/subscriptions/Subscriptions.css'

export default function SubscriptionsPage() {
  const { subscriptions, pendingConfirmations, loading, error } = useSubscriptions()
  const { trm, loading: trmLoading }                            = useTRM()
  const { charges: ccCharges, totalPending: ccPending,
          loading: ccLoading }                                  = useCreditCardCharges()
  const [showForm, setShowForm] = useState(false)

  // Total mensual estimado en COP (normalizado a mensual)
  const totalMonthlyCOP = subscriptions.reduce((sum, s) => {
    const amountCOP = s.currency === 'USD' && trm
      ? usdToCOP(s.amount, trm)
      : s.amount
    if (s.billingCycle === 'yearly')  return sum + amountCOP / 12
    if (s.billingCycle === 'weekly')  return sum + amountCOP * 4
    return sum + amountCOP
  }, 0)

  return (
    <Layout title="Suscripciones">
      {pendingConfirmations.length > 0 && (
        <div style={{
          background: '#fff8e1',
          border: '1.5px solid #fbbc04',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          marginBottom: '0.875rem',
          fontSize: '0.85rem',
          color: '#c98000',
          fontWeight: 500,
        }}>
          ⚠ {pendingConfirmations.length} suscripción{pendingConfirmations.length > 1 ? 'es necesitan' : ' necesita'} confirmación de débito
        </div>
      )}

      <div className="month-summary" style={{ marginTop: '0.75rem' }}>
        <div className="summary-chip">
          <span className="chip-label">Activas</span>
          <span className="chip-value">{subscriptions.length}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Total mes (COP)</span>
          <span className="chip-value negative">
            {trmLoading ? '...' : formatCurrency(totalMonthlyCOP)}
          </span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">TRM hoy</span>
          <span className="chip-value">
            {trmLoading ? '...' : `$${trm?.toFixed(0)}`}
          </span>
        </div>
        {ccPending > 0 && (
          <div className="summary-chip">
            <span className="chip-label">TC pendiente</span>
            <span className="chip-value negative">{formatCurrency(ccPending)}</span>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1.5px solid #ea4335',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
          marginBottom: '0.875rem',
          fontSize: '0.85rem',
          color: '#c62828',
          fontWeight: 500,
        }}>
          ⚠ Error al cargar: {error}
        </div>
      )}

      <SubscriptionList subscriptions={subscriptions} loading={loading} />

      <CreditCardChargesSection
        charges={ccCharges}
        totalPending={ccPending}
        loading={ccLoading}
      />

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Agregar suscripción">+</button>

      {showForm && <SubscriptionForm onClose={() => setShowForm(false)} />}
    </Layout>
  )
}
