import { supabase } from './supabase'

export async function addExpense(uid, { description, amount, date, categoryId, categoryLabel, categoryIcon, paymentMethod }) {
  const { error } = await supabase.from('expenses').insert({
    user_id:        uid,
    description,
    amount:         Number(amount),
    category_id:    categoryId    ?? 'other',
    category_label: categoryLabel ?? 'Otro',
    category_icon:  categoryIcon  ?? '📦',
    payment_method: paymentMethod ?? 'debit',
    date,
  })
  if (error) throw new Error(error.message)
}

export async function deleteExpense(uid, expenseId) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}
