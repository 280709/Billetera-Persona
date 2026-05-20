import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../contexts/AuthContext'
import { logout }      from '../../services/authService'
import BottomNav       from './BottomNav'
import './Layout.css'

export default function Layout({ children, title = 'Billetera Personal' }) {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{title}</h1>
        <button className="btn-logout" onClick={handleLogout}>
          Salir
        </button>
      </header>

      <main className="app-main">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
