import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLogoImageSrc } from '../contexts/LogoContext'
import { APP_NAME } from '../config'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const imgSrc = useLogoImageSrc()
  const [showMore, setShowMore] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout layout-simple">
      <aside className="sidebar sidebar-simple">
        <div className="sidebar-header">
          {imgSrc ? (
            <img src={imgSrc} alt={APP_NAME} className="sidebar-logo" />
          ) : (
            <h1>{APP_NAME}</h1>
          )}
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            🏠 Inicio
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => isActive ? 'active' : ''}>
            🛒 Vender
          </NavLink>
          <NavLink to="/cash-register" className={({ isActive }) => isActive ? 'active' : ''}>
            💰 Caja
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
            📦 Productos
          </NavLink>
          <button
            type="button"
            className={`sidebar-more-btn ${showMore ? 'open' : ''}`}
            onClick={() => setShowMore(!showMore)}
          >
            ⋯ Más
          </button>
          {showMore && (
            <div className="sidebar-more">
              <NavLink to="/tables" onClick={() => setShowMore(false)}>Mesas</NavLink>
              <NavLink to="/clients" onClick={() => setShowMore(false)}>Clientes</NavLink>
              <NavLink to="/expenses" onClick={() => setShowMore(false)}>Gastos</NavLink>
              <NavLink to="/reports" onClick={() => setShowMore(false)}>Reportes</NavLink>
              <NavLink to="/invoices" onClick={() => setShowMore(false)}>Facturación</NavLink>
              <NavLink to="/reservations" onClick={() => setShowMore(false)}>Reservas</NavLink>
              <NavLink to="/users" onClick={() => setShowMore(false)}>Usuarios</NavLink>
              <NavLink to="/settings" onClick={() => setShowMore(false)}>Ajustes</NavLink>
            </div>
          )}
        </nav>
        <div className="sidebar-footer">
          <span className="user-name">{user?.full_name}</span>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
