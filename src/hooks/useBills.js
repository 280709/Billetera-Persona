import { useEffect, useState } from 'react'
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
    estimatedDueDate: r.estimated_due_date,
    realAmount:       r.real_amount,
    realDueDate:      r.real_due_date,
    isPaid:           r.is_paid,
    isAutoDebit:      r.is_auto_debit,
    debitConfirmed:   r.debit_confirmed,
    reminderDays:     r.reminder_days,
    receiptUrl:       r.receipt_url,
    isRecurring:      r.is_recurring,
    recurrencePeriod: r.recurrence_period,
    paidAt:           r.paid_at,
    createdAt:        r.created_at,
  }
}

export function useBills() {
  const { user } = useAuth()
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      const { data } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', false)
        .order('estimated_due_date', { ascending: true })
      if (active) { setBills(data?.map(mapBill) ?? []); setLoading(false) }
    }

    load()

    const ch = supabase.channel(`bills_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const alertBills = bills.filter(b => {
    const due = new Date(b.estimatedDueDate)
    const alertDate = new Date(due)
    alertDate.setDate(alertDate.getDate() - (b.reminderDays ?? 3))
    return today >= alertDate
  })

  const pendingDebits = alertBills.filter(b => b.isAutoDebit && !b.debitConfirmed)

  return { bills, alertBills, pendingDebits, loading }
}

export function useBillHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      const { data } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', true)
        .order('paid_at', { ascending: false })
      if (active) { setHistory(data?.map(mapBill) ?? []); setLoading(false) }
    }

    load()

    return () => { active = false }
  }, [user?.id])

  return { history, loading }
}
