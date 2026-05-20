function toDate(val) {
  if (!val) return null
  if (val?.toDate) return val.toDate()
  return new Date(val)
}

/**
 * Devuelve los payDays del ingreso que realmente se recibieron en el mes dado.
 * Reglas:
 *  - Solo días ≤ cutoffDay (hoy para el mes actual, fin del mes para meses pasados)
 *  - Si startDate cae en este mes, solo días ≥ día de startDate
 *  - Si endDate cae en este mes, solo días ≤ día de endDate
 *  - Si endDate está antes de este mes, 0 pagos
 *  - Si startDate está después de este mes, 0 pagos
 */
function receivedPayDays(inc, year, month, cutoffDay) {
  const monthStart = new Date(year, month, 1)
  const monthEnd   = new Date(year, month + 1, 0) // último día del mes

  const start = toDate(inc.startDate)
  const end   = toDate(inc.endDate)

  // El ingreso no aplica en este mes
  if (start && start > monthEnd)   return []
  if (end   && end   < monthStart) return []

  // Límite inferior: si startDate cae en este mes, desde ese día; si no, desde el día 1
  const fromDay = (start && start >= monthStart)
    ? start.getDate()
    : 1

  // Límite superior: si endDate cae en este mes, hasta ese día;
  // si no, hasta cutoffDay (hoy o fin del mes)
  const toDay = (end && end <= monthEnd)
    ? Math.min(end.getDate(), cutoffDay)
    : cutoffDay

  if (!inc.payDays?.length) return []   // sin payDays no podemos saber los días exactos

  return inc.payDays.filter(d => d >= fromDay && d <= toDay)
}

export function calcBudget(incomes = [], expenses = [], subscriptions = [], refDate = new Date()) {
  const now        = refDate
  const year       = now.getFullYear()
  const month      = now.getMonth()
  const currentDay = now.getDate()
  const lastDay    = new Date(year, month + 1, 0).getDate()
  const isQ1       = currentDay <= 15

  // Para quincena usamos hoy como tope; para el resumen mensual mostramos
  // la proyección completa del mes (lastDay) — así el usuario ve lo que recibirá,
  // no solo lo que ya cobró.
  const now0 = new Date()
  const isCurrentMonth = year === now0.getFullYear() && month === now0.getMonth()
  const quincenaCutoff = isCurrentMonth ? currentDay : lastDay
  const summaryCutoff  = lastDay   // siempre proyección completa del mes

  // ── Ingresos fijos ─────────────────────────────────────────────
  const recurring = incomes.filter(i => !i.type || i.type === 'recurring')

  const recurringTotal = recurring.reduce((sum, inc) => {
    const days = receivedPayDays(inc, year, month, summaryCutoff)

    // Fallback para docs sin payDays (ingresados manualmente o con formato viejo)
    if (!inc.payDays?.length) {
      const timesPerMonth = inc.timesPerMonth ?? (inc.frequency === 'biweekly' ? 2 : 1)
      const start = toDate(inc.startDate)
      const end   = toDate(inc.endDate)
      const monthStart = new Date(year, month, 1)
      const monthEnd   = new Date(year, month + 1, 0)
      if (start && start > monthEnd)   return sum
      if (end   && end   < monthStart) return sum
      return sum + inc.amount * timesPerMonth
    }

    return sum + inc.amount * days.length
  }, 0)

  // Para quincena usamos quincenaCutoff (hasta hoy)
  const recurringQ1 = recurring.reduce((sum, inc) => {
    const days = receivedPayDays(inc, year, month, quincenaCutoff)
    return sum + inc.amount * days.filter(d => d <= 15).length
  }, 0)

  const recurringQ2 = recurring.reduce((sum, inc) => {
    const days = receivedPayDays(inc, year, month, quincenaCutoff)
    return sum + inc.amount * days.filter(d => d > 15).length
  }, 0)

  // ── Ingresos adicionales ───────────────────────────────────────
  const occasional = incomes.filter(i => i.type === 'occasional')
  const occasionalTotal = occasional.reduce((sum, inc) => sum + inc.amount, 0)

  // Separar adicionales por quincena según su fecha
  const occasionalQ1 = occasional.reduce((sum, inc) => {
    const d = inc.date?.toDate ? inc.date.toDate() : new Date(inc.date)
    return d.getDate() <= 15 ? sum + inc.amount : sum
  }, 0)
  const occasionalQ2 = occasional.reduce((sum, inc) => {
    const d = inc.date?.toDate ? inc.date.toDate() : new Date(inc.date)
    return d.getDate() > 15 ? sum + inc.amount : sum
  }, 0)

  const totalIncome = recurringTotal + occasionalTotal

  // ── Gastos ────────────────────────────────────────────────────
  const totalVariable = expenses.reduce((s, e) => s + e.amount, 0)

  // ── Suscripciones ─────────────────────────────────────────────
  const totalSubs = subscriptions
    .filter(s => s.isActive)
    .reduce((sum, s) => {
      if (s.billingCycle === 'yearly') return sum + s.amount / 12
      if (s.billingCycle === 'weekly') return sum + s.amount * 4
      return sum + s.amount
    }, 0)

  // ── Disponible total ─────────────────────────────────────────
  const availableToSpend = Math.max(totalIncome - totalSubs, 0)
  const monthRemaining   = availableToSpend - totalVariable

  // ── Quincena actual ───────────────────────────────────────────
  const quincenaIncome    = isQ1
    ? recurringQ1 + occasionalQ1
    : recurringQ2 + occasionalQ2
  const quincenaAvailable = Math.max(quincenaIncome - totalSubs / 2, 0)

  const quincenaExpenses = expenses.filter(e => {
    const d   = e.date?.toDate ? e.date.toDate() : new Date(e.date)
    const day = d.getDate()
    return isQ1 ? day <= 15 : day > 15
  })
  const quincenaSpent = quincenaExpenses.reduce((s, e) => s + e.amount, 0)
  const quincenaRemaining = quincenaAvailable - quincenaSpent
  const quincenaProgress  = quincenaAvailable > 0
    ? Math.min((quincenaSpent / quincenaAvailable) * 100, 100)
    : 0

  return {
    totalIncome,
    recurringTotal,
    occasionalTotal,
    totalSubs,
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
