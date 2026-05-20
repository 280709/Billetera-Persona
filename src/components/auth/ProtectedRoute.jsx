import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f4f8',
      fontSize: '0.9rem',
      color: '#6b7280',
    }}>
      Cargando...
    </div>
  )

  return user ? children : <Navigate to="/login" replace />
}
