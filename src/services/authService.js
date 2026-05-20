import { supabase } from './supabase'
import { getAuthErrorMessage } from '../utils/authErrors'

function check({ error }) {
  if (error) throw new Error(getAuthErrorMessage(error))
}

export async function registerWithEmail(email, password, displayName) {
  check(await supabase.auth.signUp({
    email, password,
    options: { data: { display_name: displayName } },
  }))
}

export async function loginWithEmail(email, password) {
  check(await supabase.auth.signInWithPassword({ email, password }))
}

export async function loginWithGoogle() {
  check(await supabase.auth.signInWithOAuth({
    provider: 'google',
    options:  { redirectTo: window.location.origin },
  }))
}

export async function logout() {
  await supabase.auth.signOut()
}
