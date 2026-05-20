import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { EXPENSE_CATEGORIES, BILL_CATEGORIES, SUBSCRIPTION_CATEGORIES } from '../utils/defaultCategories'

export function useCategories(type) {
  const { user } = useAuth()
  const [custom, setCustom]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      let q = supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      if (type) q = q.eq('type', type)
      const { data } = await q
      if (active) { setCustom(data ?? []); setLoading(false) }
    }

    load()

    const ch = supabase.channel(`categories_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id, type])

  const defaults = type === 'bill'
    ? BILL_CATEGORIES
    : type === 'subscription'
    ? SUBSCRIPTION_CATEGORIES
    : type === 'expense'
    ? EXPENSE_CATEGORIES
    : []

  const all = [
    ...defaults,
    ...custom.map(c => ({ id: c.id, label: c.name, icon: c.icon, isCustom: true })),
  ]

  return { categories: all, custom, loading }
}
