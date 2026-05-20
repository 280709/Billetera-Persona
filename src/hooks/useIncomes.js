import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

function mapIncome(r) {
  return {
    id:            r.id,
    description:   r.description,
    amount:        r.amount,
    type:          r.type,
    timesPerMonth: r.times_per_month,
    payDays:       r.pay_days,
    isActive:      r.is_active,
    startDate:     r.start_date,
    endDate:       r.end_date,
    date:          r.date,
    createdAt:     r.created_at,
  }
}

export function useIncomes() {
  const { user } = useAuth()
  const [incomes, setIncomes]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      const { data } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (active) { setIncomes(data?.map(mapIncome) ?? []); setLoading(false) }
    }

    load()

    const ch = supabase.channel(`incomes_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id])

  return { incomes, loading }
}
