import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function addRecurringIncome(uid, { description, amount, timesPerMonth, payDays, startDate }) {
  return addDoc(collection(db, 'users', uid, 'incomes'), {
    description,
    amount:        Number(amount),
    type:          'recurring',
    timesPerMonth: Number(timesPerMonth),
    payDays,
    isActive:      true,
    startDate:     Timestamp.fromDate(new Date(startDate)),
    endDate:       null,
    createdAt:     serverTimestamp(),
  })
}

export async function addOccasionalIncome(uid, { description, amount, date }) {
  return addDoc(collection(db, 'users', uid, 'incomes'), {
    description,
    amount:    Number(amount),
    type:      'occasional',
    date:      Timestamp.fromDate(new Date(date)),
    createdAt: serverTimestamp(),
  })
}

// Desactiva el ingreso con fecha de fin — no elimina historial
export async function deactivateIncome(uid, incomeId, endDate) {
  return updateDoc(doc(db, 'users', uid, 'incomes', incomeId), {
    isActive: false,
    endDate:  Timestamp.fromDate(new Date(endDate)),
  })
}

// Eliminación permanente (solo para limpiar datos incorrectos)
export async function deleteIncome(uid, incomeId) {
  return deleteDoc(doc(db, 'users', uid, 'incomes', incomeId))
}
