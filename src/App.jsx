import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './contexts/AuthContext'
import { useAuth }       from './contexts/AuthContext'
import ProtectedRoute    from './components/auth/ProtectedRoute'
import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'
import DashboardPage     from './pages/DashboardPage'
import ExpensesPage       from './pages/ExpensesPage'
import IncomesPage        from './pages/IncomesPage'
import BillsPage          from './pages/BillsPage'
import SubscriptionsPage  from './pages/SubscriptionsPage'

// Placeholders para las rutas pendientes
import Layout from './components/layout/Layout'
import './components/layout/Layout.css'

// Redirige al dashboard si ya hay sesión activa
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

function ComingSoon({ title }) {
  return (
    <Layout title={title}>
      <p style={{ color: 'var(--color-muted)', textAlign: 'center', marginTop: '2rem' }}>
        Sección en construcción...
      </p>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Rutas públicas — redirigen al dashboard si ya hay sesión */}
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Rutas protegidas */}
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
          <Route path="/suscripciones" element={
            <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
