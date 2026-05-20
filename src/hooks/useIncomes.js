import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useIncomes() {
  const { user } = useAuth()
  const [incomes, setIncomes]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'incomes'),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q,
      snap => {
        setIncomes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => {
        console.warn('useIncomes:', err.message)
        setLoading(false)
      }
    )
  }, [user])

  return { incomes, loading }
}
