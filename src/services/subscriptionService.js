import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function addSubscription(uid, data) {
  const {
    name, currency, amount,
    billingCycle, nextBillingDate,
    reminderDays, isAutoDebit,
    paymentMethod,
    categoryId, categoryLabel, categoryIcon,
  } = data

  return addDoc(collection(db, 'users', uid, 'subscriptions'), {
    name,
    currency:         currency || 'COP',   // 'COP' | 'USD'
    amount:           Number(amount),
    billingCycle:     billingCycle || 'monthly',
    nextBillingDate:  Timestamp.fromDate(new Date(nextBillingDate)),
    reminderDays:     Number(reminderDays) || 3,
    isAutoDebit:      Boolean(isAutoDebit),
    paymentMethod:    paymentMethod || 'debit', // 'debit' | 'credit'
    isActive:         true,
    categoryId,
    categoryLabel,
    categoryIcon,
    currentCycleConfirmed: false,
    createdAt:        serverTimestamp(),
  })
}

// ── Cargos a tarjeta de crédito ───────────────────────────────
// sourceType: 'subscription' | 'bill'
export async function addCreditCardCharge(uid, {
  sourceType = 'subscription',
  sourceId,   sourceName,
  categoryIcon, amount, billingDate,
}) {
  return addDoc(collection(db, 'users', uid, 'creditCardCharges'), {
    sourceType,
    sourceId,
    sourceName,
    categoryIcon: categoryIcon ?? '📋',
    amount:       Number(amount),
    billingDate:  billingDate ? Timestamp.fromDate(new Date(billingDate)) : serverTimestamp(),
    isPaid:       false,
    paidAt:       null,
    createdAt:    serverTimestamp(),
  })
}

export async function markCreditCardChargePaid(uid, chargeId) {
  return updateDoc(doc(db, 'users', uid, 'creditCardCharges', chargeId), {
    isPaid: true,
    paidAt: serverTimestamp(),
  })
}

export async function deleteCreditCardCharge(uid, chargeId) {
  return deleteDoc(doc(db, 'users', uid, 'creditCardCharges', chargeId))
}

// Confirmar débito de la suscripción (con posibilidad de ajustar monto real)
export async function confirmSubscriptionDebit(uid, subId, { realAmountCOP } = {}) {
  const update = {
    currentCycleConfirmed: true,
    updatedAt: serverTimestamp(),
  }
  if (realAmountCOP != null) update.lastRealAmountCOP = Number(realAmountCOP)
  return updateDoc(doc(db, 'users', uid, 'subscriptions', subId), update)
}

// Avanzar al siguiente ciclo de facturación
export async function advanceBillingCycle(uid, subId, currentNextDate, cycle) {
  const next = new Date(currentNextDate)
  if (cycle === 'monthly') next.setMonth(next.getMonth() + 1)
  else if (cycle === 'yearly') next.setFullYear(next.getFullYear() + 1)
  else if (cycle === 'weekly') next.setDate(next.getDate() + 7)

  return updateDoc(doc(db, 'users', uid, 'subscriptions', subId), {
    nextBillingDate:       Timestamp.fromDate(next),
    currentCycleConfirmed: false,
    updatedAt:             serverTimestamp(),
  })
}

export async function deactivateSubscription(uid, subId) {
  return updateDoc(doc(db, 'users', uid, 'subscriptions', subId), {
    isActive:  false,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSubscription(uid, subId) {
  return deleteDoc(doc(db, 'users', uid, 'subscriptions', subId))
}
