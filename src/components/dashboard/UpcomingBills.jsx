import { formatCurrency, daysUntil } from '../../utils/formatters'
import './Dashboard.css'

export default function UpcomingBills({ bills, loading }) {
  if (loading) return <div className="card skeleton" style={{ height: 100 }} />

  return (
    <div className="card">
      <h2 className="card-title">Próximas facturas</h2>

      {bills.length === 0 ? (
        <p className="empty-hint">No hay facturas pendientes en los próximos 30 días.</p>
      ) : (
        <ul className="bill-list">
          {bills.map(bill => {
            const days   = daysUntil(bill.estimatedDueDate ?? bill.dueDate)
            const urgent = days <= 3

            return (
              <li key={bill.id} className="bill-item">
                <span className={`bill-dot ${urgent ? 'urgent' : ''}`} />
                <div className="bill-info">
                  <span className="bill-name">
                    {bill.categoryIcon && `${bill.categoryIcon} `}{bill.name}
                    {bill.isAutoDebit && !bill.debitConfirmed && (
                      <span style={{ fontSize: '0.65rem', marginLeft: 4, color: '#c98000' }}>⚠</span>
                    )}
                  </span>
                  <span className={`bill-days ${urgent ? 'urgent' : ''}`}>
                    {days < 0 ? 'Vencida' : days === 0 ? 'Vence hoy' : `${days} días`}
                    {' · '}estimado
                  </span>
                </div>
                <span className="bill-amount">
                  {formatCurrency(bill.estimatedAmount ?? bill.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
