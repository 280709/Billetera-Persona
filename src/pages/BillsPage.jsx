import { useState }        from 'react'
import Layout              from '../components/layout/Layout'
import BillList            from '../components/bills/BillList'
import BillForm            from '../components/bills/BillForm'
import { useBills }        from '../hooks/useBills'
import { formatCurrency }  from '../utils/formatters'
import '../components/layout/Layout.css'
import '../components/expenses/Expenses.css'
import '../components/bills/Bills.css'

export default function BillsPage() {
  const { bills, alertBills, pendingDebits, loading } = useBills()
  const [showForm, setShowForm] = useState(false)

  const totalEstimated = bills.reduce((s, b) => s + b.estimatedAmount, 0)
  const pendingCount   = bills.length

  return (
    <Layout title="Facturas">
      {/* Alertas de débitos pendientes */}
      {pendingDebits.length > 0 && (
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
          ⚠ {pendingDebits.length} débito{pendingDebits.length > 1 ? 's automáticos requieren' : ' automático requiere'} confirmación
        </div>
      )}

      {/* Resumen */}
      <div className="month-summary" style={{ marginTop: '0.75rem' }}>
        <div className="summary-chip">
          <span className="chip-label">Pendientes</span>
          <span className="chip-value">{pendingCount}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Total estimado</span>
          <span className="chip-value negative">{formatCurrency(totalEstimated)}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Alertas activas</span>
          <span className="chip-value" style={{ color: alertBills.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {alertBills.length}
          </span>
        </div>
      </div>

      <BillList bills={bills} loading={loading} />

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Agregar factura">+</button>

      {showForm && <BillForm onClose={() => setShowForm(false)} />}
    </Layout>
  )
}
