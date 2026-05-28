import { supabase } from './supabase'

export async function addExpense(uid, {
  description, amount, date,
  categoryId, categoryLabel, categoryIcon,
  paymentMethod, receiptUrl,
  billId = null,
}) {
  const { data, error } = await supabase.from('expenses').insert({
    user_id:        uid,
    description,
    amount:         Number(amount),
    category_id:    categoryId    ?? 'other',
    category_label: categoryLabel ?? 'Otro',
    category_icon:  categoryIcon  ?? '📦',
    payment_method: paymentMethod ?? 'debit',
    date,
    receipt_url:    receiptUrl ?? null,
    bill_id:        billId ?? null,
  }).select('id').single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateExpense(uid, expenseId, {
  description, amount, date,
  categoryId, categoryLabel, categoryIcon,
  paymentMethod, receiptUrl,
}) {
  const { error } = await supabase.from('expenses').update({
    description,
    amount:         Number(amount),
    category_id:    categoryId,
    category_label: categoryLabel,
    category_icon:  categoryIcon,
    payment_method: paymentMethod,
    date,
    receipt_url:    receiptUrl ?? null,
  }).eq('id', expenseId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function deleteExpense(uid, expenseId) {
  const { error } = await supabase.from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', uid)
  if (error) throw new Error(error.message)
}
