import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export async function registerWithEmail(email, password, displayName) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName })
  return user
}

export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export function loginWithGoogle() {
  return signInWithRedirect(auth, googleProvider)
}

export async function logout() {
  await signOut(auth)
}
