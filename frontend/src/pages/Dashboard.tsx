import { useEffect, useState } from 'react'
import api from '../api/client'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    lowStock: 0,
    tables: 0,
    occupied: 0,
  })

  useEffect(() => {
    Promise.all([
      api.get('/inventory/products').then(r => r.data),
      api.get('/tables').then(r => r.data),
    ]).then(([products, tables]) => {
      const lowStock = products.filter((p: { stock: number; min_stock: number }) =>
        p.min_stock > 0 && (p.stock || 0) <= p.min_stock
      ).length
      const occupied = tables.filter((t: { state: string }) => t.state === 'ocupada').length
      setStats({
        products: products.length,
        lowStock,
        tables: tables.length,
        occupied,
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Productos</h3>
          <p className="stat-value">{stats.products}</p>
        </div>
        <div className="stat-card warning">
          <h3>Stock bajo</h3>
          <p className="stat-value">{stats.lowStock}</p>
        </div>
        <div className="stat-card">
          <h3>Mesas totales</h3>
          <p className="stat-value">{stats.tables}</p>
        </div>
        <div className="stat-card accent">
          <h3>Mesas ocupadas</h3>
          <p className="stat-value">{stats.occupied}</p>
        </div>
      </div>
      <div className="welcome-section">
        <h2>Bienvenido a Cafetería CLEO</h2>
        <p>Sistema de gestión integral: inventario, facturación electrónica (Hacienda CR), mesas, pedidos, clientes, gastos y reportes.</p>
      </div>
    </div>
  )
}
