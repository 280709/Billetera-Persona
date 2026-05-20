import { supabase } from './supabase'

export async function addSubscription(uid, data) {
  const { name, currency, amount, billingCycle, nextBillingDate,
          reminderDays, isAutoDebit, paymentMethod,
          categoryId, categoryLabel, categoryIcon } = data

  const { error } = await supabase.from('subscriptions').insert({
    user_id:                 uid,
    name,
    currency:                currency || 'COP',
    amount:                  Number(amount),
    billing_cycle:           billingCycle || 'monthly',
    next_billing_date:       nextBillingDate,
    reminder_days:           Number(reminderDays) || 3,
    is_auto_debit:           Boolean(isAutoDebit),
    payment_method:          paymentMethod || 'debit',
    category_id:             categoryId,
    category_label:          categoryLabel,
    category_icon:           categoryIcon,
    current_cycle_confirmed: false,
  })
  if (error) throw new Error(error.message)
}

export async function confirmSubscriptionDebit(uid, subId, { realAmountCOP } = {}) {
  const update = { current_cycle_confirmed: true, updated_at: new Date().toISOString() }
  if (realAmountCOP != null) update.last_real_amount_cop = Number(realAmountCOP)
  const { error } = await supabase.from('subscriptions').update(update).eq('id', subId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function advanceBillingCycle(uid, subId, currentNextDate, cycle) {
  const next = new Date(currentNextDate)
  if (cycle === 'monthly') next.setMonth(next.getMonth() + 1)
  else if (cycle === 'yearly')  next.setFullYear(next.getFullYear() + 1)
  else if (cycle === 'weekly')  next.setDate(next.getDate() + 7)
  const nextStr = next.toISOString().split('T')[0]

  const { error } = await supabase.from('subscriptions').update({
    next_billing_date:       nextStr,
    current_cycle_confirmed: false,
    updated_at:              new Date().toISOString(),
  }).eq('id', subId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function deactivateSubscription(uid, subId) {
  const { error } = await supabase.from('subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', subId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function deleteSubscription(uid, subId) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', subId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

// ── Cargos TC ────────────────────────────────────────────────────
export async function addCreditCardCharge(uid, { sourceType = 'subscription', sourceId, sourceName, categoryIcon, amount, billingDate }) {
  const { error } = await supabase.from('credit_card_charges').insert({
    user_id:      uid,
    source_type:  sourceType,
    source_id:    sourceId ?? null,
    source_name:  sourceName,
    category_icon: categoryIcon ?? '📋',
    amount:       Number(amount),
    billing_date: billingDate ? (typeof billingDate === 'string' ? billingDate : billingDate.toISOString().split('T')[0]) : null,
  })
  if (error) throw new Error(error.message)
}

export async function markCreditCardChargePaid(uid, chargeId) {
  const { error } = await supabase.from('credit_card_charges').update({
    is_paid: true,
    paid_at: new Date().toISOString(),
  }).eq('id', chargeId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}

export async function deleteCreditCardCharge(uid, chargeId) {
  const { error } = await supabase.from('credit_card_charges').delete().eq('id', chargeId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}
