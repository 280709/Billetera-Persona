import { supabase } from './supabase'

export async function uploadReceipt(uid, file) {
  const ext     = file.name.split('.').pop().toLowerCase()
  const allowed = ['jpg', 'jpeg', 'png', 'pdf', 'webp']
  if (!allowed.includes(ext)) throw new Error('Formato no permitido. Usa JPG, PNG o PDF.')
  if (file.size > 5 * 1024 * 1024) throw new Error('El archivo supera 5 MB.')

  const path = `${uid}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('receipts').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('receipts').getPublicUrl(path)
  return data.publicUrl
}
