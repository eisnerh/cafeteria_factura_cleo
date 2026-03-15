import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import './Orders.css'

interface Order {
  id: number
  session_id?: number
  client_id?: number
  status: string
  notes?: string
  items?: { id: number; quantity: number; unit_price: number; product?: { name: string } }[]
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const params = filter ? `?status=${filter}` : ''
    apiFetch<Order[]>(`/orders${params}`).then(setOrders).catch(console.error).finally(() => setLoading(false))
  }, [filter])

  if (loading) return <div className="page"><p>Cargando pedidos...</p></div>
  return (
    <div className="page orders-page">
      <h1>Pedidos</h1>
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Todos</option>
        <option value="pendiente">Pendientes</option>
        <option value="en_preparacion">En preparación</option>
        <option value="entregado">Entregados</option>
        <option value="cobrado">Cobrados</option>
      </select>
      <div className="orders-list">
        {orders.map(o => (
          <div key={o.id} className="card order-card">
            <div className="order-header">
              <span className="order-id">#{o.id}</span>
              <span className={`badge status-${o.status}`}>{o.status}</span>
            </div>
            {o.items?.length ? (
              <ul className="order-items">
                {o.items.map(i => (
                  <li key={i.id}>{i.product?.name || 'Producto'} x {i.quantity} - ₡{(Number(i.quantity) * Number(i.unit_price)).toFixed(2)}</li>
                ))}
              </ul>
            ) : <p>Sin ítems</p>}
            <p className="total">Total: ₡{o.items?.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0).toFixed(2) || '0.00'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
