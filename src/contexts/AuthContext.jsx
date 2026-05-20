import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Procesa el resultado cuando Google redirige de vuelta a la app
    getRedirectResult(auth).catch(() => {})

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // No-blocking: el perfil se crea en segundo plano, no bloquea la app
        setDoc(
          doc(db, 'users', firebaseUser.uid),
          {
            displayName: firebaseUser.displayName ?? '',
            email:       firebaseUser.email,
            currency:    'COP',
            createdAt:   serverTimestamp(),
          },
          { merge: true }
        ).catch(e => console.warn('Perfil Firestore:', e.message))
      }
      // Siempre actualiza el estado inmediatamente, sin esperar Firestore
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
