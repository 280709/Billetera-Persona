import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useCreditCardCharges() {
  const { user } = useAuth()
  const [charges, setCharges]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'creditCardCharges'),
      where('isPaid', '==', false),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q,
      snap => { setCharges(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      err  => { console.warn('useCreditCardCharges:', err.message); setLoading(false) }
    )
  }, [user])

  const totalPending = charges.reduce((s, c) => s + c.amount, 0)

  return { charges, totalPending, loading }
}
