import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/settings/logo`)
      .then((r) => r.json())
      .then((d: { url: string | null }) => setLogoUrl(d.url))
      .catch(() => setLogoUrl(null))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const logoSrc = logoUrl || import.meta.env.VITE_LOGO_URL
  const imgSrc = logoSrc
    ? logoSrc.startsWith('http')
      ? logoSrc
      : API_BASE.startsWith('http')
        ? new URL(logoSrc.startsWith('/') ? logoSrc : '/' + logoSrc, new URL(API_BASE).origin).href
        : (logoSrc.startsWith('/') ? logoSrc : '/' + logoSrc)
    : ''

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="Logo Cafetería"
              className="sidebar-logo"
            />
          ) : (
            <h1>Cafetería CLEO</h1>
          )}
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => isActive ? 'active' : ''}>
            Punto de Venta
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
            Inventario
          </NavLink>
          <NavLink to="/tables" className={({ isActive }) => isActive ? 'active' : ''}>
            Mesas
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>
            Pedidos
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => isActive ? 'active' : ''}>
            Clientes
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? 'active' : ''}>
            Facturación
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => isActive ? 'active' : ''}>
            Gastos
          </NavLink>
          <NavLink to="/reservations" className={({ isActive }) => isActive ? 'active' : ''}>
            Reservas
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
            Reportes
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
            Usuarios
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            Configuración
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="user-name">{user?.full_name}</span>
          <button onClick={handleLogout} className="btn-logout">Cerrar sesión</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
