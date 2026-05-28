import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth }      from './contexts/AuthContext'
import ProtectedRoute   from './components/auth/ProtectedRoute'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import DashboardPage    from './pages/DashboardPage'
import ExpensesPage     from './pages/ExpensesPage'
import IncomesPage      from './pages/IncomesPage'
import BillsPage        from './pages/BillsPage'
import SettingsPage     from './pages/SettingsPage'
import Layout           from './components/layout/Layout'
import './components/layout/Layout.css'

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          }/>
          <Route path="/gastos" element={
            <ProtectedRoute><ExpensesPage /></ProtectedRoute>
          }/>
          <Route path="/ingresos" element={
            <ProtectedRoute><IncomesPage /></ProtectedRoute>
          }/>
          <Route path="/facturas" element={
            <ProtectedRoute><BillsPage /></ProtectedRoute>
          }/>
          <Route path="/configuracion" element={
            <ProtectedRoute><SettingsPage /></ProtectedRoute>
          }/>

          {/* Redirigir URLs antiguas de suscripciones */}
          <Route path="/suscripciones" element={<Navigate to="/facturas" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
