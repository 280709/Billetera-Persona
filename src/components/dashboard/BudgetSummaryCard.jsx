import { formatCurrency } from '../../utils/formatters'
import './Dashboard.css'

export default function BudgetSummaryCard({ budget }) {
  if (!budget) return <div className="card skeleton" style={{ height: 180 }} />

  const { totalIncome, totalFixed, availableToSpend, monthRemaining } = budget
  const isNegative = monthRemaining < 0

  return (
    <div className="card">
      <h2 className="card-title">Resumen del mes</h2>

      <div className="budget-rows">
        <div className="budget-row">
          <span>Ingresos</span>
          <span className="amount positive">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="budget-row">
          <span>Facturas fijas</span>
          <span className="amount negative">− {formatCurrency(totalFixed ?? 0)}</span>
        </div>
      </div>

      <div className="budget-divider" />

      <div className="budget-row total">
        <span>Disponible variable</span>
        <span className={`amount ${isNegative ? 'negative' : 'positive'}`}>
          {formatCurrency(availableToSpend)}
        </span>
      </div>

      {totalIncome === 0 && (
        <p className="empty-hint">
          Agrega tus ingresos en la sección Ingresos para ver el resumen.
        </p>
      )}
    </div>
  )
}
