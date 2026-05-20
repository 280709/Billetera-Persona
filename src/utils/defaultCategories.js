export const EXPENSE_CATEGORIES = [
  { id: 'food',       label: 'Comida',      icon: '🍔' },
  { id: 'transport',  label: 'Transporte',  icon: '🚌' },
  { id: 'health',     label: 'Salud',       icon: '💊' },
  { id: 'leisure',    label: 'Ocio',        icon: '🎮' },
  { id: 'shopping',   label: 'Compras',     icon: '🛍️' },
  { id: 'education',  label: 'Educación',   icon: '📚' },
  { id: 'home',       label: 'Hogar',       icon: '🏠' },
  { id: 'beauty',     label: 'Belleza',     icon: '💄' },
  { id: 'other',      label: 'Otro',        icon: '📦' },
]

export const BILL_CATEGORIES = [
  { id: 'utilities',  label: 'Servicios públicos', icon: '💡' },
  { id: 'internet',   label: 'Internet / Telefonía', icon: '📶' },
  { id: 'rent',       label: 'Arriendo',            icon: '🏠' },
  { id: 'debt',       label: 'Deuda / Crédito',     icon: '💳' },
  { id: 'insurance',  label: 'Seguro',              icon: '🛡️' },
  { id: 'health',     label: 'Salud',               icon: '🏥' },
  { id: 'transport',  label: 'Transporte',          icon: '🚌' },
  { id: 'other',      label: 'Otro',                icon: '📋' },
]

export const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming',  label: 'Streaming',     icon: '🎬' },
  { id: 'fitness',    label: 'Gimnasio',      icon: '💪' },
  { id: 'software',   label: 'Software',      icon: '💻' },
  { id: 'cloud',      label: 'Almacenamiento', icon: '☁️' },
  { id: 'food',       label: 'Alimentación',  icon: '🍔' },
  { id: 'education',  label: 'Educación',     icon: '📚' },
  { id: 'other',      label: 'Otro',          icon: '📦' },
]

export function findCategory(id, list) {
  return list.find(c => c.id === id) ?? { id, label: id, icon: '📋' }
}
