import {
  collection, addDoc, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function addCustomCategory(uid, { name, icon, type }) {
  return addDoc(collection(db, 'users', uid, 'categories'), {
    name:      name.trim(),
    icon:      icon || '🏷️',
    type,       // 'bill' | 'subscription' | 'expense'
    isDefault: false,
    createdAt: serverTimestamp(),
  })
}

export async function deleteCustomCategory(uid, categoryId) {
  return deleteDoc(doc(db, 'users', uid, 'categories', categoryId))
}
