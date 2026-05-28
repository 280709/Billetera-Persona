import { useState }      from 'react'
import { useAuth }       from '../../contexts/AuthContext'
import { deleteExpense } from '../../services/expenseService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import './Expenses.css'

const LEGACY_META = {
  food:      { label: 'Comida',     icon: '🍔' },
  transport: { label: 'Transporte', icon: '🚌' },
  health:    { label: 'Salud',      icon: '💊' },
  leisure:   { label: 'Ocio',       icon: '🎮' },
  other:     { label: 'Otro',       icon: '📦' },
}

function resolveCategory(exp) {
  if (exp.categoryIcon) return { label: exp.categoryLabel, icon: exp.categoryIcon }
  return LEGACY_META[exp.categoryId] ?? LEGACY_META.other
}

export default function ExpenseList({ expenses, loading, onEdit }) {
  const { user }                        = useAuth()
  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId]     = useState(null)
  const [errorId, setErrorId]           = useState(null)
  // Oculta ítems eliminados de inmediato sin esperar Realtime
  const [deletedIds, setDeletedIds]     = useState(new Set())

  const visible = expenses.filter(e => !deletedIds.has(e.id))

  async function handleDelete(id) {
    setDeletingId(id)
    setErrorId(null)
    try {
      await deleteExpense(user.id, id)
      setDeletedIds(prev => new Set([...prev, id]))
      setConfirmingId(null)
    } catch (err) {
      setErrorId(id)
      console.error('Error eliminando gasto:', err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return (
    <div className="card">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />
      ))}
    </div>
  )

  if (visible.length === 0) return (
    <div className="card">
      <p className="empty-hint">Sin gastos este mes. Pulsa + para agregar el primero.</p>
    </div>
  )

  return (
    <div className="card">
      {visible.map(exp => {
        const { label, icon } = resolveCategory(exp)
        const isCredit   = exp.paymentMethod === 'credit'
        const isBillPay  = Boolean(exp.billId)
        const confirming = confirmingId === exp.id
        const deleting   = deletingId   === exp.id
        const hasError   = errorId      === exp.id

        return (
          <div key={exp.id} className="expense-row" style={{ flexWrap: 'wrap' }}>
            <div className="category-dot cat-other">{icon}</div>

            <div className="expense-info">
              <span className="expense-name">
                {exp.description}
                {isCredit  && <span className="pm-expense-badge">TC</span>}
                {isBillPay && (
                  <span className="pm-expense-badge" style={{ background: '#e8f0fe', color: '#1a73e8' }}>📋</span>
                )}
                {exp.receiptUrl && (
                  <a
                    href={exp.receiptUrl} target="_blank" rel="noopener noreferrer"
                    className="receipt-badge" title="Ver recibo"
                    onClick={e => e.stopPropagation()}
                  >📎</a>
                )}
              </span>
              <span className="expense-meta">
                {label} · {formatDate(exp.date)}
                {hasError && <span style={{ color: 'var(--color-danger)', marginLeft: '0.4rem' }}>⚠ Error al eliminar</span>}
              </span>
            </div>

            <span className="expense-amount">− {formatCurrency(exp.amount)}</span>

            {confirming ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', paddingLeft: '2.5rem',
                fontSize: '0.8rem', color: 'var(--color-danger)',
              }}>
                <span>¿Eliminar?</span>
                <button
                  onClick={() => handleDelete(exp.id)} disabled={deleting}
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
              </div>
            ) : (
              <>
                <button
                  className="btn-delete" onClick={() => onEdit(exp)}
                  aria-label="Editar gasto" style={{ color: 'var(--color-muted)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  className="btn-delete" onClick={() => setConfirmingId(exp.id)}
                  aria-label="Eliminar gasto"
                >
                  <svg viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
