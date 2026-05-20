import { formatCurrency } from '../../utils/formatters'
import { progressColor }  from '../../utils/budgetCalculator'
import './Dashboard.css'

export default function QuincenaCard({ budget }) {
  if (!budget) return <div className="card skeleton" style={{ height: 160 }} />

  const { available, spent, remaining, progress, number } = budget.quincena
  const color = progressColor(progress)

  return (
    <div className="card">
      <div className="card-header-row">
        <h2 className="card-title">Quincena {number}</h2>
        <span className={`badge badge-${color}`}>{Math.round(progress)}% usado</span>
      </div>

      <div className="progress-bar-wrap">
        <div
          className={`progress-bar progress-bar-${color}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="quincena-amounts">
        <div className="quincena-stat">
          <span className="stat-label">Disponible</span>
          <span className="stat-value">{formatCurrency(available)}</span>
        </div>
        <div className="quincena-stat">
          <span className="stat-label">Gastado</span>
          <span className="stat-value negative">{formatCurrency(spent)}</span>
        </div>
        <div className="quincena-stat">
          <span className="stat-label">Restante</span>
          <span className={`stat-value ${remaining < 0 ? 'negative' : 'positive'}`}>
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>
    </div>
  )
}
