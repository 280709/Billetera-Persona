import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

function mapSubscription(r) {
  return {
    id:                   r.id,
    name:                 r.name,
    currency:             r.currency,
    amount:               r.amount,
    billingCycle:         r.billing_cycle,
    nextBillingDate:      r.next_billing_date,
    reminderDays:         r.reminder_days,
    isAutoDebit:          r.is_auto_debit,
    paymentMethod:        r.payment_method,
    categoryId:           r.category_id,
    categoryLabel:        r.category_label,
    categoryIcon:         r.category_icon,
    isActive:             r.is_active,
    currentCycleConfirmed: r.current_cycle_confirmed,
    lastRealAmountCOP:    r.last_real_amount_cop,
    createdAt:            r.created_at,
  }
}

export function useSubscriptions() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      try {
        const { data, error: sbError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('next_billing_date', { ascending: true })
        if (sbError) throw sbError
        if (active) { setSubscriptions(data?.map(mapSubscription) ?? []); setError(null); setLoading(false) }
      } catch (err) {
        console.error('[useSubscriptions] Error:', err)
        if (active) { setError(err.message || 'Error al cargar suscripciones'); setLoading(false) }
      }
    }

    load()

    const ch = supabase.channel(`subscriptions_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pendingConfirmations = subscriptions.filter(s => {
    if (s.currentCycleConfirmed) return false
    const due = new Date(s.nextBillingDate)
    const alertDate = new Date(due)
    alertDate.setDate(alertDate.getDate() - (s.reminderDays ?? 3))
    return today >= alertDate
  })

  return { subscriptions, pendingConfirmations, loading, error }
}
