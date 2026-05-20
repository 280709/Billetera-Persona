import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useBills() {
  const { user } = useAuth()
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'bills'),
      where('isPaid', '==', false),
      orderBy('estimatedDueDate', 'asc')
    )
    return onSnapshot(q,
      snap => {
        setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => { console.warn('useBills:', err.message); setLoading(false) }
    )
  }, [user])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Facturas cuya alerta ya se activó: hoy >= estimatedDueDate - reminderDays
  const alertBills = bills.filter(b => {
    const due = b.estimatedDueDate?.toDate?.() ?? new Date(b.estimatedDueDate)
    const alertDate = new Date(due)
    alertDate.setDate(alertDate.getDate() - (b.reminderDays ?? 3))
    return today >= alertDate
  })

  // Débitos automáticos sin confirmar cuya fecha ya llegó o está en alerta
  const pendingDebits = alertBills.filter(b => b.isAutoDebit && !b.debitConfirmed)

  return { bills, alertBills, pendingDebits, loading }
}

export function useBillHistory(billId) {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !billId) return
    const q = query(
      collection(db, 'users', user.uid, 'billHistory'),
      where('billId', '==', billId),
      orderBy('paidAt', 'desc')
    )
    return onSnapshot(q,
      snap => { setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      () => setLoading(false)
    )
  }, [user, billId])

  return { history, loading }
}
