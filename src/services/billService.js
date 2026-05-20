import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Crear factura ──────────────────────────────────────────────
export async function addBill(uid, data) {
  const {
    name, categoryId, categoryLabel, categoryIcon,
    estimatedAmount, estimatedDueDate,
    isAutoDebit, isRecurring, recurrencePeriod, reminderDays,
  } = data

  return addDoc(collection(db, 'users', uid, 'bills'), {
    name,
    categoryId,
    categoryLabel,
    categoryIcon,
    estimatedAmount:   Number(estimatedAmount),
    estimatedDueDate:  Timestamp.fromDate(new Date(estimatedDueDate)),
    realAmount:        null,
    realDueDate:       null,
    isPaid:            false,
    paidAt:            null,
    receiptUrl:        null,
    isAutoDebit:       Boolean(isAutoDebit),
    isRecurring:       Boolean(isRecurring),
    recurrencePeriod:  isRecurring ? recurrencePeriod : null,
    reminderDays:      Number(reminderDays) || 3,
    debitConfirmed:    isAutoDebit ? false : null,
    createdAt:         serverTimestamp(),
    updatedAt:         serverTimestamp(),
  })
}

// ── Registrar pago (exige monto y fecha reales) ───────────────
export async function payBill(uid, billId, { realAmount, realDueDate, receiptUrl }) {
  if (!realAmount || realAmount <= 0) throw new Error('El monto real es obligatorio.')
  if (!realDueDate) throw new Error('La fecha real de pago es obligatoria.')

  await updateDoc(doc(db, 'users', uid, 'bills', billId), {
    realAmount:   Number(realAmount),
    realDueDate:  Timestamp.fromDate(new Date(realDueDate)),
    isPaid:       true,
    paidAt:       serverTimestamp(),
    receiptUrl:   receiptUrl ?? null,
    updatedAt:    serverTimestamp(),
  })
}

// ── Confirmar débito automático ───────────────────────────────
export async function confirmDebit(uid, billId) {
  await updateDoc(doc(db, 'users', uid, 'bills', billId), {
    debitConfirmed: true,
    updatedAt:      serverTimestamp(),
  })
}

// ── Crear ciclo siguiente para facturas recurrentes ───────────
export async function createNextCycle(uid, bill) {
  const months = {
    monthly:    1,
    bimonthly:  2,
    quarterly:  3,
    yearly:    12,
  }
  const add = months[bill.recurrencePeriod] ?? 1
  const next = bill.estimatedDueDate?.toDate
    ? bill.estimatedDueDate.toDate()
    : new Date(bill.estimatedDueDate)
  next.setMonth(next.getMonth() + add)

  return addDoc(collection(db, 'users', uid, 'bills'), {
    name:              bill.name,
    categoryId:        bill.categoryId,
    categoryLabel:     bill.categoryLabel,
    categoryIcon:      bill.categoryIcon,
    estimatedAmount:   bill.realAmount ?? bill.estimatedAmount,  // usa el real como nuevo estimado
    estimatedDueDate:  Timestamp.fromDate(next),
    realAmount:        null,
    realDueDate:       null,
    isPaid:            false,
    paidAt:            null,
    receiptUrl:        null,
    isAutoDebit:       bill.isAutoDebit,
    isRecurring:       true,
    recurrencePeriod:  bill.recurrencePeriod,
    reminderDays:      bill.reminderDays,
    debitConfirmed:    bill.isAutoDebit ? false : null,
    createdAt:         serverTimestamp(),
    updatedAt:         serverTimestamp(),
  })
}

export async function deleteBill(uid, billId) {
  return deleteDoc(doc(db, 'users', uid, 'bills', billId))
}
