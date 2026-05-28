import { useState, useMemo } from 'react'
import Layout                from '../components/layout/Layout'
import BillList              from '../components/bills/BillList'
import BillForm              from '../components/bills/BillForm'
import { useBills }          from '../hooks/useBills'
import { formatCurrency }    from '../utils/formatters'
import '../components/layout/Layout.css'
import '../components/expenses/Expenses.css'
import '../components/bills/Bills.css'

export default function BillsPage() {
  const { bills, alertBills, overdueBills, loading, error } = useBills()
  const [showForm, setShowForm]   = useState(false)
  const [editingBill, setEditingBill] = useState(null)

  const totalEstimated = useMemo(
    () => bills.reduce((s, b) => s + b.estimatedAmount, 0),
    [bills]
  )

  function handleEdit(bill) {
    setEditingBill(bill)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingBill(null)
  }

  return (
    <Layout title="Facturas">

      {overdueBills.length > 0 && (
        <div style={{
          background: '#fef2f2', border: '1.5px solid #ea4335',
          borderRadius: '0.75rem', padding: '0.75rem 1rem',
          marginBottom: '0.875rem', fontSize: '0.85rem',
          color: '#c62828', fontWeight: 500,
        }}>
          ⚠ {overdueBills.length} factura{overdueBills.length > 1 ? 's vencidas' : ' vencida'} — registra el pago o actualiza la fecha
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1.5px solid #ea4335',
          borderRadius: '0.75rem', padding: '0.75rem 1rem',
          marginBottom: '0.875rem', fontSize: '0.85rem',
          color: '#c62828', fontWeight: 500,
        }}>
          ⚠ Error al cargar: {error}
        </div>
      )}

      <div className="month-summary" style={{ marginTop: '0.75rem' }}>
        <div className="summary-chip">
          <span className="chip-label">Pendientes</span>
          <span className="chip-value">{bills.length}</span>
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
        {overdueBills.length > 0 && (
          <div className="summary-chip">
            <span className="chip-label">Vencidas</span>
            <span className="chip-value" style={{ color: 'var(--color-danger)' }}>
              {overdueBills.length}
            </span>
          </div>
        )}
      </div>

      <BillList bills={bills} loading={loading} onEdit={handleEdit} />

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Agregar factura">+</button>

      {showForm && (
        <BillForm
          onClose={handleCloseForm}
          bill={editingBill}
        />
      )}
    </Layout>
  )
}
