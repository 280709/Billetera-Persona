import { supabase } from './supabase'

export async function addRecurringIncome(uid, { description, amount, timesPerMonth, payDays, startDate }) {
  const { error } = await supabase.from('incomes').insert({
    user_id:         uid,
    description,
    amount:          Number(amount),
    type:            'recurring',
    times_per_month: Number(timesPerMonth),
    pay_days:        payDays,
    is_active:       true,
    start_date:      startDate,
  })
  if (error) throw new Error(error.message)
}

export async function addOccasionalIncome(uid, { description, amount, date }) {
  const { error } = await supabase.from('incomes').insert({
    user_id: uid,
    description,
    amount:  Number(amount),
    type:    'occasional',
    date,
  })
  if (error) throw new Error(error.message)
}

export async function deactivateIncome(uid, incomeId, endDate) {
  const { error } = await supabase.from('incomes')
    .update({ is_active: false, end_date: endDate })
    .eq('id', incomeId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function deleteIncome(uid, incomeId) {
  const { error } = await supabase.from('incomes').delete().eq('id', incomeId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}
