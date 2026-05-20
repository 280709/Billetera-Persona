import { useState }        from 'react'
import { formatCurrency, formatDate } from '../../utils/formatters'
import DeactivateSheet     from './DeactivateSheet'
import '../expenses/Expenses.css'
import './Incomes.css'

function freqLabel(inc) {
  const n = inc.timesPerMonth ?? (inc.frequency === 'biweekly' ? 2 : 1)
  if (n === 1) return '1 vez al mes'
  if (n === 2) return 'Quincenal'
  if (n === 4) return 'Semanal'
  return `${n} veces al mes`
}

export default function IncomeList({ incomes, loading }) {
  const [managing, setManaging] = useState(null)

  if (loading) {
    return (
      <div className="card">
        {[1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  const recurring  = incomes.filter(i => (!i.type || i.type === 'recurring') && i.isActive !== false)
  const occasional = incomes.filter(i => i.type === 'occasional')

  if (incomes.filter(i => i.isActive !== false).length === 0 && occasional.length === 0) {
    return (
      <div className="card">
        <p className="empty-hint">Sin ingresos registrados. Pulsa + para agregar.</p>
      </div>
    )
  }

  return (
    <>
      {/* Ingresos fijos */}
      {recurring.length > 0 && (
        <>
          <p className="income-section-title">Ingresos fijos</p>
          <div className="card">
            {recurring.map(inc => (
              <div key={inc.id} className="income-row">
                <div className="income-icon recurring">💰</div>
                <div className="income-info">
                  <span className="income-name">{inc.description}</span>
                  <span className="income-meta">
                    {inc.payDays?.length ? `Días ${inc.payDays.join(' y ')} · ` : ''}
                    {freqLabel(inc)}
                  </span>
                </div>
                <div className="income-right">
                  <span className={`freq-badge ${(inc.timesPerMonth ?? 1) > 1 ? 'biweekly' : ''}`}>
                    {freqLabel(inc)}
                  </span>
                  <span className="income-amount">{formatCurrency(inc.amount)}</span>
                  <button
                    className="btn-delete"
                    onClick={() => setManaging(inc)}
                    aria-label="Gestionar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5"  r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Ingresos adicionales */}
      {occasional.length > 0 && (
        <>
          <p className="income-section-title">Ingresos adicionales</p>
          <div className="card">
            {occasional.map(inc => (
              <div key={inc.id} className="income-row">
                <div className="income-icon occasional">⚡</div>
                <div className="income-info">
                  <span className="income-name">{inc.description}</span>
                  <span className="income-meta">{formatDate(inc.date)}</span>
                </div>
                <div className="income-right">
                  <span className="income-amount">{formatCurrency(inc.amount)}</span>
                  <button
                    className="btn-delete"
                    onClick={() => setManaging(inc)}
                    aria-label="Gestionar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5"  r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {managing && (
        <DeactivateSheet income={managing} onClose={() => setManaging(null)} />
      )}
    </>
  )
}
