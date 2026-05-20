import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../utils/formatters'
import './Dashboard.css'

const CATEGORY_LABEL = {
  food:      'Comida',
  transport: 'Transporte',
  health:    'Salud',
  leisure:   'Ocio',
  other:     'Otro',
}

export default function RecentExpenses({ expenses, loading }) {
  if (loading) return <div className="card skeleton" style={{ height: 140 }} />

  const recent = expenses.slice(0, 5)

  return (
    <div className="card">
      <div className="card-header-row">
        <h2 className="card-title">Últimos gastos</h2>
        <Link to="/gastos" className="card-link">Ver todos</Link>
      </div>

      {recent.length === 0 ? (
        <p className="empty-hint">
          No hay gastos este mes.{' '}
          <Link to="/gastos">Registra el primero.</Link>
        </p>
      ) : (
        <ul className="expense-list">
          {recent.map(exp => (
            <li key={exp.id} className="expense-item">
              <div className="expense-info">
                <span className="expense-name">{exp.description}</span>
                <span className="expense-category">
                  {CATEGORY_LABEL[exp.category] ?? exp.category}
                </span>
              </div>
              <div className="expense-right">
                <span className="expense-amount negative">
                  − {formatCurrency(exp.amount)}
                </span>
                <span className="expense-date">
                  {formatDate(exp.date)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
