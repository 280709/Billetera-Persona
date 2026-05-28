import { supabase } from './supabase'
import { addExpense } from './expenseService'

// ── Meses que avanza cada período ────────────────────────────────
const PERIOD_MONTHS = { monthly: 1, bimonthly: 2, quarterly: 3, yearly: 12 }

function nextDueDate(currentDueDate, period) {
  const next = new Date(currentDueDate)
  if (period === 'weekly') {
    next.setDate(next.getDate() + 7)
  } else {
    next.setMonth(next.getMonth() + (PERIOD_MONTHS[period] ?? 1))
  }
  return next.toISOString().split('T')[0]
}

// ── CRUD ─────────────────────────────────────────────────────────

export async function addBill(uid, data) {
  const {
    name, categoryId, categoryLabel, categoryIcon,
    estimatedAmount, dueDate, paymentMethod, currency,
    isRecurring, recurrencePeriod, reminderDays,
  } = data

  const { error } = await supabase.from('bills').insert({
    user_id:          uid,
    name,
    category_id:      categoryId,
    category_label:   categoryLabel,
    category_icon:    categoryIcon,
    estimated_amount: Number(estimatedAmount),
    due_date:         dueDate,
    payment_method:   paymentMethod ?? 'debit',
    currency:         currency ?? 'COP',
    is_recurring:     Boolean(isRecurring),
    recurrence_period: isRecurring ? recurrencePeriod : null,
    reminder_days:    Number(reminderDays) || 3,
  })
  if (error) throw new Error(error.message)
}

export async function updateBill(uid, billId, data) {
  const {
    name, categoryId, categoryLabel, categoryIcon,
    estimatedAmount, dueDate, paymentMethod, currency,
    isRecurring, recurrencePeriod, reminderDays,
  } = data

  const { error } = await supabase.from('bills').update({
    name,
    category_id:      categoryId,
    category_label:   categoryLabel,
    category_icon:    categoryIcon,
    estimated_amount: Number(estimatedAmount),
    due_date:         dueDate,
    payment_method:   paymentMethod ?? 'debit',
    currency:         currency ?? 'COP',
    is_recurring:     Boolean(isRecurring),
    recurrence_period: isRecurring ? recurrencePeriod : null,
    reminder_days:    Number(reminderDays) || 3,
    updated_at:       new Date().toISOString(),
  }).eq('id', billId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function deleteBill(uid, billId) {
  const { error } = await supabase.from('bills')
    .delete()
    .eq('id', billId)
    .eq('user_id', uid)
  if (error) throw new Error(error.message)
}

// Reactivar una factura no recurrente que fue marcada como pagada
export async function reactivateBill(uid, billId) {
  const { error } = await supabase.from('bills').update({
    is_paid:    false,
    updated_at: new Date().toISOString(),
  }).eq('id', billId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

// ── Flujo de pago ─────────────────────────────────────────────────
//
// Al pagar una factura:
//   1. Se crea un registro en `expenses` con bill_id apuntando a esta factura
//   2a. Si es recurrente: se avanza due_date al siguiente ciclo
//   2b. Si no es recurrente: se marca is_paid = true
//
// Para deshacer: eliminar el expense desde el módulo de Gastos.
//   (para facturas no recurrentes, usar reactivateBill si es necesario)
export async function payBill(uid, bill, { amount, date, paymentMethod, receiptUrl }) {
  if (!amount || Number(amount) <= 0) throw new Error('El monto es obligatorio.')
  if (!date) throw new Error('La fecha de pago es obligatoria.')

  // 1. Crear el gasto — fuente de verdad del pago
  await addExpense(uid, {
    description:   bill.name,
    amount:        Number(amount),
    date,
    categoryId:    bill.categoryId,
    categoryLabel: bill.categoryLabel,
    categoryIcon:  bill.categoryIcon,
    paymentMethod: paymentMethod ?? 'debit',
    receiptUrl:    receiptUrl ?? null,
    billId:        bill.id,
  })

  // 2. Actualizar la factura según su tipo
  if (bill.isRecurring) {
    const { error } = await supabase.from('bills').update({
      due_date:    nextDueDate(bill.dueDate, bill.recurrencePeriod),
      updated_at:  new Date().toISOString(),
    }).eq('id', bill.id).eq('user_id', uid)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('bills').update({
      is_paid:    true,
      updated_at: new Date().toISOString(),
    }).eq('id', bill.id).eq('user_id', uid)
    if (error) throw new Error(error.message)
  }
}
