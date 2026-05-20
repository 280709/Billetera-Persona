import { useState }    from 'react'
import Layout           from '../components/layout/Layout'
import IncomeList       from '../components/incomes/IncomeList'
import IncomeForm       from '../components/incomes/IncomeForm'
import { useIncomes }   from '../hooks/useIncomes'
import { formatCurrency } from '../utils/formatters'
import '../components/layout/Layout.css'
import '../components/expenses/Expenses.css'
import '../components/incomes/Incomes.css'

export default function IncomesPage() {
  const { incomes, loading } = useIncomes()
  const [showForm, setShowForm] = useState(false)

  const recurringTotal  = incomes
    .filter(i => (!i.type || i.type === 'recurring') && i.isActive !== false)
    .reduce((s, i) => {
      // Usa payDays si existe, si no timesPerMonth, si no frequency legacy
      const times = i.payDays?.length ?? i.timesPerMonth ?? (i.frequency === 'biweekly' ? 2 : 1)
      return s + i.amount * times
    }, 0)

  const occasionalTotal = incomes
    .filter(i => i.type === 'occasional')
    .reduce((s, i) => s + i.amount, 0)

  const totalMonth = recurringTotal + occasionalTotal

  return (
    <Layout title="Ingresos">
      {/* Resumen */}
      <div className="month-summary" style={{ marginTop: '0.75rem' }}>
        <div className="summary-chip">
          <span className="chip-label">Total mes</span>
          <span className="chip-value" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(totalMonth)}
          </span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Fijos</span>
          <span className="chip-value">{formatCurrency(recurringTotal)}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Adicionales</span>
          <span className="chip-value">{formatCurrency(occasionalTotal)}</span>
        </div>
      </div>

      <IncomeList incomes={incomes} loading={loading} />

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Agregar ingreso">
        +
      </button>

      {showForm && <IncomeForm onClose={() => setShowForm(false)} />}
    </Layout>
  )
}
