import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadReceipt(uid, file) {
  const ext       = file.name.split('.').pop().toLowerCase()
  const allowed   = ['jpg', 'jpeg', 'png', 'pdf', 'webp']
  if (!allowed.includes(ext)) throw new Error('Formato no permitido. Usa JPG, PNG o PDF.')
  if (file.size > 5 * 1024 * 1024) throw new Error('El archivo supera 5 MB.')

  const path     = `users/${uid}/receipts/${Date.now()}.${ext}`
  const fileRef  = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}
