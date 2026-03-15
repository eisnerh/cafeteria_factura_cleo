import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    lowStock: 0,
    tables: 0,
    occupied: 0,
    cajaOpen: false,
    ventasHoy: 0,
    pedidosPendientes: 0,
  })

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      api.get('/inventory/products').then(r => r.data),
      api.get('/tables').then(r => r.data),
      api.get('/cash-register/current').then(r => r.data).catch(() => ({ open: false, session: null })),
      api.get(`/reports/sales-by-cobro?desde=${today}&hasta=${today}`).then(r => r.data).catch(() => ({ data: [] })),
      api.get('/orders', { params: { status: 'pendiente' } }).then(r => r.data).catch(() => []),
    ]).then((result) => {
      const [products, tables, caja, salesReport, pendingOrders] = result as [
        { stock: number; min_stock?: number }[],
        { state: string }[],
        { open?: boolean; session?: unknown } | null,
        { data?: { total: number }[] } | undefined,
        unknown
      ]
      const prods = Array.isArray(products) ? products : []
      const tbls = Array.isArray(tables) ? tables : []
      const lowStock = prods.filter((p) =>
        (p.min_stock ?? 0) > 0 && (p.stock || 0) <= (p.min_stock ?? 0)
      ).length
      const occupied = tbls.filter((t: { state: string }) => t.state === 'ocupada').length
      const reportData = (salesReport && 'data' in salesReport && Array.isArray(salesReport.data)) ? salesReport.data : []
      const ventasHoy = reportData.reduce((s: number, d: { total?: number }) => s + (d.total || 0), 0)
      const cajaObj = caja && typeof caja === 'object' && 'open' in caja ? caja : null
      setStats({
        products: prods.length,
        lowStock,
        tables: tbls.length,
        occupied,
        cajaOpen: !!(cajaObj?.open),
        ventasHoy,
        pedidosPendientes: Array.isArray(pendingOrders) ? (pendingOrders as unknown[]).length : 0,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="dashboard dashboard-simple">
      <h1 className="dashboard-simple-title">¿Qué quieres hacer?</h1>

      <div className="dashboard-quick-stats">
        <div className={`dashboard-stat-card ${stats.cajaOpen ? 'success' : ''}`}>
          <span className="stat-label">Caja</span>
          <span className="stat-value">{stats.cajaOpen ? 'Abierta' : 'Cerrada'}</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="stat-label">Ventas hoy</span>
          <span className="stat-value">₡{stats.ventasHoy.toLocaleString('es-CR')}</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="stat-label">Pedidos pendientes</span>
          <span className="stat-value">{stats.pedidosPendientes}</span>
        </div>
      </div>

      <div className="dashboard-big-actions">
        <Link to="/pos" className="dashboard-big-btn primary">
          <span className="dashboard-big-icon">🛒</span>
          <span className="dashboard-big-text">Vender</span>
          <span className="dashboard-big-hint">Cobrar pedidos</span>
        </Link>
        <Link to="/cash-register" className="dashboard-big-btn">
          <span className="dashboard-big-icon">💰</span>
          <span className="dashboard-big-text">Caja</span>
          <span className="dashboard-big-hint">Abrir o cerrar</span>
        </Link>
        <Link to="/inventory" className={`dashboard-big-btn ${stats.lowStock > 0 ? 'warning' : ''}`}>
          <span className="dashboard-big-icon">📦</span>
          <span className="dashboard-big-text">Productos</span>
          <span className="dashboard-big-hint">{stats.lowStock > 0 ? `${stats.lowStock} con poco stock` : 'Ver y editar'}</span>
        </Link>
      </div>

      <div className="dashboard-secondary-actions">
        <Link to="/invoices" className="dashboard-mini-btn">📄 Facturación</Link>
        <Link to="/reports" className="dashboard-mini-btn">📊 Reportes</Link>
        <Link to="/expenses" className="dashboard-mini-btn">💸 Gastos</Link>
        <Link to="/reservations" className="dashboard-mini-btn">📅 Reservas</Link>
        <Link to="/tables" className="dashboard-mini-btn">🪑 Mesas</Link>
        <Link to="/clients" className="dashboard-mini-btn">👥 Clientes</Link>
      </div>
    </div>
  )
}
