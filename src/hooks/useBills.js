import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

function mapBill(r) {
  return {
    id:               r.id,
    name:             r.name,
    categoryId:       r.category_id,
    categoryLabel:    r.category_label,
    categoryIcon:     r.category_icon,
    estimatedAmount:  r.estimated_amount,
    dueDate:          r.due_date,
    paymentMethod:    r.payment_method,
    currency:         r.currency ?? 'COP',
    isPaid:           r.is_paid,
    isRecurring:      r.is_recurring,
    recurrencePeriod: r.recurrence_period,
    reminderDays:     r.reminder_days,
    createdAt:        r.created_at,
  }
}

export function useBills() {
  const { user } = useAuth()
  const [bills, setBills]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      try {
        const { data, error: sbError } = await supabase
          .from('bills')
          .select('id, name, category_id, category_label, category_icon, estimated_amount, due_date, payment_method, currency, is_paid, is_recurring, recurrence_period, reminder_days, created_at')
          .eq('user_id', user.id)
          .eq('is_paid', false)
          .order('due_date', { ascending: true })
        if (sbError) throw sbError
        if (active) { setBills(data?.map(mapBill) ?? []); setError(null); setLoading(false) }
      } catch (err) {
        if (active) { setError(err.message || 'Error al cargar facturas'); setLoading(false) }
      }
    }

    load()

    const ch = supabase.channel(`bills_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id])

  const { alertBills, overdueBills } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const alertBills = bills.filter(b => {
      const due = new Date(b.dueDate)
      const alertDate = new Date(due)
      alertDate.setDate(alertDate.getDate() - (b.reminderDays ?? 3))
      return today >= alertDate
    })

    const overdueBills = bills.filter(b => new Date(b.dueDate) < today)

    return { alertBills, overdueBills }
  }, [bills])

  return { bills, alertBills, overdueBills, loading, error }
}
