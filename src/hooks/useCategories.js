import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'
import { EXPENSE_CATEGORIES, BILL_CATEGORIES, SUBSCRIPTION_CATEGORIES } from '../utils/defaultCategories'

export function useCategories(type) {
  const { user } = useAuth()
  const [custom, setCustom]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'categories'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q,
      snap => {
        setCustom(snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(c => !type || c.type === type)
        )
        setLoading(false)
      },
      () => { setCustom([]); setLoading(false) }
    )
  }, [user, type])

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
