import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useSubscriptions() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'subscriptions'),
      where('isActive', '==', true),
      orderBy('nextBillingDate', 'asc')
    )
    return onSnapshot(q,
      snap => {
        setSubscriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => { console.warn('useSubscriptions:', err.message); setLoading(false) }
    )
  }, [user])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Suscripciones con alerta activa y sin confirmar
  const pendingConfirmations = subscriptions.filter(s => {
    if (s.currentCycleConfirmed) return false
    const due = s.nextBillingDate?.toDate?.() ?? new Date(s.nextBillingDate)
    const alertDate = new Date(due)
    alertDate.setDate(alertDate.getDate() - (s.reminderDays ?? 3))
    return today >= alertDate
  })

  return { subscriptions, pendingConfirmations, loading }
}
