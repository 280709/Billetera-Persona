import { usdToCOP } from '../services/trmService'

function toDate(val) {
  return val ? new Date(val) : null
}

function receivedPayDays(inc, year, month, cutoffDay) {
  const monthStart = new Date(year, month, 1)
  const monthEnd   = new Date(year, month + 1, 0)

  const start = toDate(inc.startDate)
  const end   = toDate(inc.endDate)

  if (start && start > monthEnd)   return []
  if (end   && end   < monthStart) return []

  const fromDay = (start && start >= monthStart) ? start.getDate() : 1
  const toDay   = (end && end <= monthEnd)
    ? Math.min(end.getDate(), cutoffDay)
    : cutoffDay

  if (!inc.payDays?.length) return []
  return inc.payDays.filter(d => d >= fromDay && d <= toDay)
}

// bills: array de facturas activas (is_paid = false) del hook useBills
// trm: tasa de cambio COP/USD (para facturas en USD)
export function calcBudget(incomes = [], expenses = [], bills = [], trm = 4200, refDate = new Date()) {
  const now        = refDate
  const year       = now.getFullYear()
  const month      = now.getMonth()
  const currentDay = now.getDate()
  const lastDay    = new Date(year, month + 1, 0).getDate()
  const isQ1       = currentDay <= 15

  const now0 = new Date()
  const isCurrentMonth  = year === now0.getFullYear() && month === now0.getMonth()
  const quincenaCutoff  = isCurrentMonth ? currentDay : lastDay
  const summaryCutoff   = lastDay

  // ── Ingresos ────────────────────────────────────────────────────
  const recurring  = incomes.filter(i => !i.type || i.type === 'recurring')
  const occasional = incomes.filter(i => i.type === 'occasional')

  const { recurringTotal, recurringQ1, recurringQ2 } = recurring.reduce(
    (acc, inc) => {
      if (!inc.payDays?.length) {
        const timesPerMonth = inc.timesPerMonth ?? 1
        const start = toDate(inc.startDate)
        const end   = toDate(inc.endDate)
        const monthStart = new Date(year, month, 1)
        const monthEnd   = new Date(year, month + 1, 0)
        if (start && start > monthEnd)   return acc
        if (end   && end   < monthStart) return acc
        acc.recurringTotal += inc.amount * timesPerMonth
        return acc
      }
      const daysTotal = receivedPayDays(inc, year, month, summaryCutoff)
      const daysQ     = receivedPayDays(inc, year, month, quincenaCutoff)
      acc.recurringTotal += inc.amount * daysTotal.length
      acc.recurringQ1    += inc.amount * daysQ.filter(d => d <= 15).length
      acc.recurringQ2    += inc.amount * daysQ.filter(d => d > 15).length
      return acc
    },
    { recurringTotal: 0, recurringQ1: 0, recurringQ2: 0 }
  )

  const occasionalTotal = occasional.reduce((s, i) => s + i.amount, 0)

  const occasionalQ1 = occasional.reduce((s, i) => {
    const d = new Date(i.date)
    return d.getDate() <= 15 ? s + i.amount : s
  }, 0)
  const occasionalQ2 = occasional.reduce((s, i) => {
    const d = new Date(i.date)
    return d.getDate() > 15 ? s + i.amount : s
  }, 0)

  const totalIncome = recurringTotal + occasionalTotal

  // ── Gastos variables ─────────────────────────────────────────────
  const totalVariable = expenses.reduce((s, e) => s + e.amount, 0)

  // ── Facturas recurrentes (equivalente mensual) ───────────────────
  // Solo las recurrentes se consideran costo fijo mensual del presupuesto.
  // Las facturas únicas pendientes no se incluyen aquí (son gastos eventuales).
  const totalFixed = bills
    .filter(b => b.isRecurring)
    .reduce((sum, b) => {
      const amount = b.currency === 'USD' ? usdToCOP(b.estimatedAmount, trm) : b.estimatedAmount
      if (b.recurrencePeriod === 'yearly')    return sum + amount / 12
      if (b.recurrencePeriod === 'weekly')    return sum + amount * 4
      if (b.recurrencePeriod === 'bimonthly') return sum + amount / 2
      if (b.recurrencePeriod === 'quarterly') return sum + amount / 3
      return sum + amount // monthly
    }, 0)

  // ── Disponible ───────────────────────────────────────────────────
  const availableToSpend = Math.max(totalIncome - totalFixed, 0)
  const monthRemaining   = availableToSpend - totalVariable

  // ── Quincena ─────────────────────────────────────────────────────
  const quincenaIncome    = isQ1
    ? recurringQ1 + occasionalQ1
    : recurringQ2 + occasionalQ2
  const quincenaAvailable = Math.max(quincenaIncome - totalFixed / 2, 0)

  const quincenaExpenses = expenses.filter(e => {
    const day = new Date(e.date).getDate()
    return isQ1 ? day <= 15 : day > 15
  })
  const quincenaSpent     = quincenaExpenses.reduce((s, e) => s + e.amount, 0)
  const quincenaRemaining = quincenaAvailable - quincenaSpent
  const quincenaProgress  = quincenaAvailable > 0
    ? Math.min((quincenaSpent / quincenaAvailable) * 100, 100)
    : 0

  return {
    totalIncome,
    recurringTotal,
    occasionalTotal,
    totalFixed,
    availableToSpend,
    totalVariable,
    monthRemaining,
    quincena: {
      number:    isQ1 ? 1 : 2,
      available: quincenaAvailable,
      spent:     quincenaSpent,
      remaining: quincenaRemaining,
      progress:  quincenaProgress,
    },
  }
}

export function progressColor(pct) {
  if (pct >= 85) return 'danger'
  if (pct >= 60) return 'warning'
  return 'success'
}
