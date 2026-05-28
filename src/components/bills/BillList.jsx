import { useState }                   from 'react'
import { useAuth }                    from '../../contexts/AuthContext'
import { deleteBill }                 from '../../services/billService'
import { formatCurrency, formatDate, daysUntil } from '../../utils/formatters'
import PayBillSheet                   from './PayBillSheet'
import '../expenses/Expenses.css'
import './Bills.css'

function daysChip(days) {
  if (days < 0)   return { cls: 'overdue', label: 'Vencida' }
  if (days === 0) return { cls: 'urgent',  label: 'Hoy' }
  if (days <= 3)  return { cls: 'urgent',  label: `${days}d` }
  if (days <= 7)  return { cls: 'warning', label: `${days}d` }
  return               { cls: 'ok',      label: `${days}d` }
}

function BillRow({ bill, onPay, onEdit, onDelete }) {
  const days = daysUntil(bill.dueDate)
  const chip = daysChip(days)

  return (
    <div className="bill-row">
      <div className="bill-cat-icon">{bill.categoryIcon ?? '📋'}</div>

      <div className="bill-row-info">
        <div className="bill-row-name">
          {bill.name}
          {bill.isRecurring && <span className="auto-badge">↺</span>}
          {bill.currency === 'USD' && <span className="auto-badge">USD</span>}
        </div>
        <div className="bill-row-meta">
          {bill.categoryLabel} · Vence {formatDate(bill.dueDate)}
        </div>
      </div>

      <div className="bill-row-right">
        <div>
          <div className="bill-est-amount">{formatCurrency(bill.estimatedAmount)}</div>
          <div className="bill-est-label">estimado</div>
        </div>
        <span className={`days-chip ${chip.cls}`}>{chip.label}</span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button className="btn-pay pay" onClick={() => onPay(bill)}>Pagar</button>
          <button
            className="btn-pay"
            style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            onClick={() => onEdit(bill)}
          >✏️</button>
          <button
            className="btn-pay"
            style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
            onClick={() => onDelete(bill.id)}
          >🗑️</button>
        </div>
      </div>
    </div>
  )
}

export default function BillList({ bills, loading, onEdit }) {
  const { user }                        = useAuth()
  const [paying, setPaying]             = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId]     = useState(null)
  const [errorId, setErrorId]           = useState(null)
  // Oculta ítems eliminados de inmediato sin esperar Realtime
  const [deletedIds, setDeletedIds]     = useState(new Set())

  const visible = bills.filter(b => !deletedIds.has(b.id))

  async function handleDelete(id) {
    setDeletingId(id)
    setErrorId(null)
    try {
      await deleteBill(user.id, id)
      setDeletedIds(prev => new Set([...prev, id]))
      setConfirmingId(null)
    } catch (err) {
      setErrorId(id)
      console.error('Error eliminando factura:', err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return (
    <div className="card">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 72, marginBottom: 8, borderRadius: 8 }} />
      ))}
    </div>
  )

  if (visible.length === 0) return (
    <div className="card">
      <p className="empty-hint">Sin facturas pendientes. Pulsa + para agregar.</p>
    </div>
  )

  return (
    <>
      <div className="card">
        {visible.map(bill => {
          const confirming = confirmingId === bill.id
          const deleting   = deletingId   === bill.id
          const hasError   = errorId      === bill.id

          return confirming ? (
            <div key={bill.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {bill.categoryIcon} {bill.name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-danger)' }}>¿Eliminar esta factura?</span>
                <button
                  onClick={() => handleDelete(bill.id)} disabled={deleting}
                  style={{
                    background: 'var(--color-danger)', color: '#fff',
                    border: 'none', borderRadius: '0.4rem',
                    padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  {deleting ? '...' : 'Sí, eliminar'}
                </button>
                <button
                  onClick={() => { setConfirmingId(null); setErrorId(null) }}
                  style={{
                    background: 'none', color: 'var(--color-muted)',
                    border: '1px solid var(--color-border)', borderRadius: '0.4rem',
                    padding: '0.25rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >Cancelar</button>
                {hasError && <span style={{ color: 'var(--color-danger)' }}>⚠ Error al eliminar</span>}
              </div>
            </div>
          ) : (
            <BillRow
              key={bill.id}
              bill={bill}
              onPay={setPaying}
              onEdit={onEdit}
              onDelete={setConfirmingId}
            />
          )
        })}
      </div>

      {paying && <PayBillSheet bill={paying} onClose={() => setPaying(null)} />}
    </>
  )
}
