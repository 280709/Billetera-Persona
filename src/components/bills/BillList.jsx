import { useState }           from 'react'
import { useAuth }            from '../../contexts/AuthContext'
import { deleteBill }         from '../../services/billService'
import { formatCurrency, formatDate, daysUntil } from '../../utils/formatters'
import PayBillSheet           from './PayBillSheet'
import '../expenses/Expenses.css'
import './Bills.css'

function daysChip(days) {
  if (days < 0)  return { cls: 'overdue', label: 'Vencida' }
  if (days === 0) return { cls: 'urgent',  label: 'Hoy' }
  if (days <= 3)  return { cls: 'urgent',  label: `${days}d` }
  if (days <= 7)  return { cls: 'warning', label: `${days}d` }
  return              { cls: 'ok',      label: `${days}d` }
}

function BillRow({ bill, onPay }) {
  const days   = daysUntil(bill.estimatedDueDate)
  const chip   = daysChip(days)
  const needsDebitConfirm = bill.isAutoDebit && !bill.debitConfirmed

  return (
    <div className="bill-row">
      <div className="bill-cat-icon">{bill.categoryIcon ?? '📋'}</div>

      <div className="bill-row-info">
        <div className="bill-row-name">
          {bill.name}
          {bill.isAutoDebit && (
            <span className={`auto-badge${needsDebitConfirm ? ' pending-confirm' : ''}`}>
              {needsDebitConfirm ? '⚠ Confirmar' : 'Auto'}
            </span>
          )}
          {bill.isRecurring && (
            <span className="auto-badge">↺</span>
          )}
        </div>
        <div className="bill-row-meta">
          {bill.categoryLabel} · Vence {formatDate(bill.estimatedDueDate)} (estimado)
        </div>
      </div>

      <div className="bill-row-right">
        <div>
          <div className="bill-est-amount">{formatCurrency(bill.estimatedAmount)}</div>
          <div className="bill-est-label">estimado</div>
        </div>
        <span className={`days-chip ${chip.cls}`}>{chip.label}</span>
        <button
          className={`btn-pay ${needsDebitConfirm ? 'debit' : 'pay'}`}
          onClick={() => onPay(bill)}
        >
          {needsDebitConfirm ? 'Confirmar' : 'Pagar'}
        </button>
      </div>
    </div>
  )
}

export default function BillList({ bills, loading }) {
  const { user }         = useAuth()
  const [paying, setPaying] = useState(null)

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta factura?')) return
    await deleteBill(user.uid, id)
  }

  if (loading) return (
    <div className="card">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 72, marginBottom: 8, borderRadius: 8 }} />
      ))}
    </div>
  )

  if (bills.length === 0) return (
    <div className="card">
      <p className="empty-hint">Sin facturas pendientes. Pulsa + para agregar.</p>
    </div>
  )

  return (
    <>
      <div className="card">
        {bills.map(bill => (
          <BillRow key={bill.id} bill={bill} onPay={setPaying} />
        ))}
      </div>

      {paying && (
        <PayBillSheet bill={paying} onClose={() => setPaying(null)} />
      )}
    </>
  )
}
