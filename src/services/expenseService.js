import {
  collection, addDoc, deleteDoc,
  doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function addExpense(uid, {
  description, amount, date,
  categoryId, categoryLabel, categoryIcon,
  paymentMethod,
}) {
  return addDoc(collection(db, 'users', uid, 'expenses'), {
    description,
    amount:        Number(amount),
    categoryId:    categoryId    ?? 'other',
    categoryLabel: categoryLabel ?? 'Otro',
    categoryIcon:  categoryIcon  ?? '📦',
    paymentMethod: paymentMethod ?? 'debit',
    date:          Timestamp.fromDate(new Date(date)),
    createdAt:     serverTimestamp(),
  })
}

export async function deleteExpense(uid, expenseId) {
  return deleteDoc(doc(db, 'users', uid, 'expenses', expenseId))
}
