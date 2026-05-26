import { useState }         from 'react'
import { useAuth }         from '../../contexts/AuthContext'
import { deleteExpense }   from '../../services/expenseService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import './Expenses.css'

// Fallback para gastos guardados con el esquema antiguo (campo `category`)
const LEGACY_META = {
  food:      { label: 'Comida',     icon: '🍔' },
  transport: { label: 'Transporte', icon: '🚌' },
  health:    { label: 'Salud',      icon: '💊' },
  leisure:   { label: 'Ocio',       icon: '🎮' },
  other:     { label: 'Otro',       icon: '📦' },
}

function resolveCategory(exp) {
  if (exp.categoryIcon) return { label: exp.categoryLabel, icon: exp.categoryIcon }
  return LEGACY_META[exp.category] ?? LEGACY_META.other
}

export default function ExpenseList({ expenses, loading }) {
  const { user } = useAuth()
  const [deletingId, setDeletingId] = useState(null)

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await deleteExpense(user.uid, id)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="card">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="card">
        <p className="empty-hint">Sin gastos este mes. Pulsa + para agregar el primero.</p>
      </div>
    )
  }

  return (
    <div className="card">
      {expenses.map(exp => {
        const { label, icon } = resolveCategory(exp)
        const isCredit = exp.paymentMethod === 'credit'
        return (
          <div key={exp.id} className="expense-row">
            <div className="category-dot cat-other">{icon}</div>

            <div className="expense-info">
              <span className="expense-name">
                {exp.description}
                {isCredit && <span className="pm-expense-badge">TC</span>}
                {exp.receiptUrl && (
                  <a
                    href={exp.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="receipt-badge"
                    title="Ver recibo"
                    onClick={e => e.stopPropagation()}
                  >📎</a>
                )}
              </span>
              <span className="expense-meta">
                {label} · {formatDate(exp.date)}
              </span>
            </div>

            <span className="expense-amount">− {formatCurrency(exp.amount)}</span>

            <button
              className="btn-delete"
              onClick={() => handleDelete(exp.id)}
              disabled={deletingId === exp.id}
              aria-label="Eliminar gasto"
            >
              <svg viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
