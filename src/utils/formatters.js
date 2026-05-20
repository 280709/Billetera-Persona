export function formatCurrency(amount, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(timestampOrDate) {
  const date = timestampOrDate?.toDate
    ? timestampOrDate.toDate()
    : new Date(timestampOrDate)
  return new Intl.DateTimeFormat('es-CO', {
    day:   'numeric',
    month: 'short',
  }).format(date)
}

export function formatMonthYear(date = new Date()) {
  return new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year:  'numeric',
  }).format(date)
}

export function daysUntil(timestampOrDate) {
  const target = timestampOrDate?.toDate
    ? timestampOrDate.toDate()
    : new Date(timestampOrDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}
