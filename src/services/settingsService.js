import { supabase } from './supabase'

export async function saveAISettings(uid, { aiProvider, geminiApiKey, geminiModel }) {
  const { error } = await supabase.from('user_config').upsert({
    user_id:        uid,
    ai_provider:    aiProvider,
    gemini_api_key: geminiApiKey,
    gemini_model:   geminiModel,
    updated_at:     new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
}

export async function removeAIKey(uid) {
  const { error } = await supabase.from('user_config').update({
    gemini_api_key: null,
    updated_at:     new Date().toISOString(),
  }).eq('user_id', uid)
  if (error) throw new Error(error.message)
}
