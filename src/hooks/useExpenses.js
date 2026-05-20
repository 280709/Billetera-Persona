import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, query,
  where, orderBy, Timestamp,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useExpenses({ year, month } = {}) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return

    const now   = new Date()
    const y     = year  ?? now.getFullYear()
    const m     = month ?? now.getMonth()
    const start = new Date(y, m, 1)
    const end   = new Date(y, m + 1, 0, 23, 59, 59)

    const q = query(
      collection(db, 'users', user.uid, 'expenses'),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end)),
      orderBy('date', 'desc')
    )
    return onSnapshot(q,
      snap => {
        setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => {
        console.warn('useExpenses:', err.message)
        setLoading(false)
      }
    )
  }, [user, year, month])

  return { expenses, loading }
}
