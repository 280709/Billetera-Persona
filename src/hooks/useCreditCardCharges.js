import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

function mapCharge(r) {
  return {
    id:           r.id,
    sourceType:   r.source_type,
    sourceId:     r.source_id,
    sourceName:   r.source_name,
    categoryIcon: r.category_icon,
    amount:       r.amount,
    billingDate:  r.billing_date,
    isPaid:       r.is_paid,
    paidAt:       r.paid_at,
    createdAt:    r.created_at,
  }
}

export function useCreditCardCharges() {
  const { user } = useAuth()
  const [charges, setCharges]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      try {
        const { data, error: sbError } = await supabase
          .from('credit_card_charges')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_paid', false)
          .order('created_at', { ascending: false })
        if (sbError) throw sbError
        if (active) { setCharges(data?.map(mapCharge) ?? []); setLoading(false) }
      } catch (err) {
        console.error('[useCreditCardCharges] Error:', err)
        if (active) { setLoading(false) }
      }
    }

    load()

    const ch = supabase.channel(`cc_charges_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_card_charges', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id])

  const totalPending = charges.reduce((s, c) => s + c.amount, 0)

  return { charges, totalPending, loading }
}
