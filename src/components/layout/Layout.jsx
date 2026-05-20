import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth }     from '../../contexts/AuthContext'
import { logout }      from '../../services/authService'
import BottomNav       from './BottomNav'
import './Layout.css'

export default function Layout({ children, title = 'Billetera Personal' }) {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const onSettings = location.pathname === '/configuracion'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{title}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn-logout"
            style={{ padding: '0.4rem 0.6rem', background: onSettings ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }}
            onClick={() => navigate(onSettings ? '/' : '/configuracion')}
            aria-label="Configuración"
          >
            ⚙
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <main className="app-main">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
