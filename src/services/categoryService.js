import { supabase } from './supabase'

export async function addCustomCategory(uid, { name, icon, type }) {
  const { data, error } = await supabase.from('categories').insert({
    user_id: uid,
    name:    name.trim(),
    icon:    icon || '🏷️',
    type,
  }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCustomCategory(uid, categoryId) {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId).eq('user_id', uid)
  if (error) throw new Error(error.message)
}
