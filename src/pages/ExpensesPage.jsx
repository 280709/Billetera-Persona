import { useState } from 'react'
import Layout        from '../components/layout/Layout'
import ExpenseList   from '../components/expenses/ExpenseList'
import ExpenseForm   from '../components/expenses/ExpenseForm'
import { useExpenses }     from '../hooks/useExpenses'
import { formatCurrency, formatMonthYear } from '../utils/formatters'
import '../components/layout/Layout.css'
import '../components/expenses/Expenses.css'

export default function ExpensesPage() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [showForm, setShowForm] = useState(false)

  const { expenses, loading } = useExpenses(period)

  const isCurrentMonth =
    period.year === now.getFullYear() && period.month === now.getMonth()

  function prevMonth() {
    setPeriod(p => {
      const d = new Date(p.year, p.month - 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function nextMonth() {
    if (isCurrentMonth) return
    setPeriod(p => {
      const d = new Date(p.year, p.month + 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const totalSpent  = expenses.reduce((s, e) => s + e.amount, 0)
  const debitSpent  = expenses.filter(e => e.paymentMethod !== 'credit').reduce((s, e) => s + e.amount, 0)
  const creditSpent = expenses.filter(e => e.paymentMethod === 'credit').reduce((s, e) => s + e.amount, 0)

  const periodDate = new Date(period.year, period.month, 1)

  return (
    <Layout title="Gastos">
      {/* Navegador de mes */}
      <div className="month-nav">
        <button className="month-btn" onClick={prevMonth}>‹</button>
        <span>{formatMonthYear(periodDate)}</span>
        <button className="month-btn" onClick={nextMonth} disabled={isCurrentMonth}>›</button>
      </div>

      {/* Resumen rápido */}
      <div className="month-summary">
        <div className="summary-chip">
          <span className="chip-label">Total</span>
          <span className="chip-value negative">{formatCurrency(totalSpent)}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">🏦 Débito</span>
          <span className="chip-value">{formatCurrency(debitSpent)}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">💳 Crédito</span>
          <span className="chip-value" style={{ color: creditSpent > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {formatCurrency(creditSpent)}
          </span>
        </div>
      </div>

      {/* Lista */}
      <ExpenseList expenses={expenses} loading={loading} />

      {/* FAB */}
      <button className="fab" onClick={() => setShowForm(true)} aria-label="Agregar gasto">
        +
      </button>

      {/* Bottom sheet formulario */}
      {showForm && <ExpenseForm onClose={() => setShowForm(false)} />}
    </Layout>
  )
}
