import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth }  from '../contexts/AuthContext'

function mapExpense(r) {
  return {
    id:            r.id,
    description:   r.description,
    amount:        r.amount,
    categoryId:    r.category_id,
    categoryLabel: r.category_label,
    categoryIcon:  r.category_icon,
    paymentMethod: r.payment_method,
    date:          r.date,
    receiptUrl:    r.receipt_url ?? null,
    // legacy compat
    category:      r.category_id,
    createdAt:     r.created_at,
  }
}

export function useExpenses({ year, month } = {}) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const now = new Date()
    const y   = year  ?? now.getFullYear()
    const m   = month ?? now.getMonth()
    const dateStart = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const nextMonth = new Date(y, m + 1, 1)
    const dateEnd   = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`

    let active = true

    async function load() {
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', dateStart)
        .lt('date', dateEnd)
        .order('date', { ascending: false })
      if (active) { setExpenses(data?.map(mapExpense) ?? []); setLoading(false) }
    }

    load()

    const ch = supabase.channel(`expenses_${user.id}_${y}_${m}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id, year, month])

  return { expenses, loading }
}
