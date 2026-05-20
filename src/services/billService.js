import { supabase } from './supabase'

export async function addBill(uid, data) {
  const { name, categoryId, categoryLabel, categoryIcon,
          estimatedAmount, estimatedDueDate,
          isAutoDebit, isRecurring, recurrencePeriod, reminderDays } = data

  const { error } = await supabase.from('bills').insert({
    user_id:             uid,
    name,
    category_id:         categoryId,
    category_label:      categoryLabel,
    category_icon:       categoryIcon,
    estimated_amount:    Number(estimatedAmount),
    estimated_due_date:  estimatedDueDate,
    is_auto_debit:       Boolean(isAutoDebit),
    is_recurring:        Boolean(isRecurring),
    recurrence_period:   isRecurring ? recurrencePeriod : null,
    reminder_days:       Number(reminderDays) || 3,
    debit_confirmed:     isAutoDebit ? false : null,
  })
  if (error) throw new Error(error.message)
}

export async function payBill(uid, billId, { realAmount, realDueDate, receiptUrl }) {
  if (!realAmount || realAmount <= 0) throw new Error('El monto real es obligatorio.')
  if (!realDueDate) throw new Error('La fecha real de pago es obligatoria.')

  const { error } = await supabase.from('bills').update({
    real_amount:   Number(realAmount),
    real_due_date: realDueDate,
    is_paid:       true,
    paid_at:       new Date().toISOString(),
    receipt_url:   receiptUrl ?? null,
    updated_at:    new Date().toISOString(),
  }).eq('id', billId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function confirmDebit(uid, billId) {
  const { error } = await supabase.from('bills').update({
    debit_confirmed: true,
    updated_at:      new Date().toISOString(),
  }).eq('id', billId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function createNextCycle(uid, bill) {
  const months = { monthly: 1, bimonthly: 2, quarterly: 3, yearly: 12 }
  const add  = months[bill.recurrencePeriod] ?? 1
  const next = new Date(bill.estimatedDueDate)
  next.setMonth(next.getMonth() + add)
  const nextStr = next.toISOString().split('T')[0]

  const { error } = await supabase.from('bills').insert({
    user_id:             uid,
    name:                bill.name,
    category_id:         bill.categoryId,
    category_label:      bill.categoryLabel,
    category_icon:       bill.categoryIcon,
    estimated_amount:    bill.realAmount ?? bill.estimatedAmount,
    estimated_due_date:  nextStr,
    is_auto_debit:       bill.isAutoDebit,
    is_recurring:        true,
    recurrence_period:   bill.recurrencePeriod,
    reminder_days:       bill.reminderDays,
    debit_confirmed:     bill.isAutoDebit ? false : null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteBill(uid, billId) {
  const { error } = await supabase.from('bills').delete().eq('id', billId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}
