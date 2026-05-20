import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'

function mapSettings(r) {
  if (!r) return {}
  return {
    aiProvider:    r.ai_provider,
    geminiApiKey:  r.gemini_api_key,
    geminiModel:   r.gemini_model,
  }
}

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let active = true

    async function load() {
      const { data } = await supabase
        .from('user_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (active) { setSettings(mapSettings(data)); setLoading(false) }
    }

    load()

    const ch = supabase.channel(`user_config_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_config', filter: `user_id=eq.${user.id}` }, load)
      .subscribe()

    return () => { active = false; supabase.removeChannel(ch) }
  }, [user?.id])

  return { settings, loading }
}
