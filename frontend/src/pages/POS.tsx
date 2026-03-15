import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import './POS.css'

interface Product {
  id: number
  name: string
  description?: string
  price: number
  stock: number
  min_stock?: number
  category_id?: number
}

interface Category {
  id: number
  name: string
}

interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

export default function POS() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away'>('dine_in')
  const [customerName, setCustomerName] = useState('')
  const [tableName, setTableName] = useState('')
  const [orderCount, setOrderCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/inventory/categories').catch(() => ({ data: [] as Category[] })),
      api.get<Product[]>('/inventory/products').catch(() => ({ data: [] as Product[] })),
      api.get<unknown[]>('/orders').catch(() => ({ data: [] as unknown[] })),
    ]).then(([catRes, prodRes, ordRes]) => {
      setCategories(catRes.data)
      setProducts(prodRes.data)
      setOrderCount(Array.isArray(ordRes.data) ? ordRes.data.length : 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filteredProducts = products.filter(p => {
    const matchCat = !selectedCat || p.category_id === selectedCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const getLowStockCount = (catId: number) => 
    products.filter(p => p.category_id === catId && (p.min_stock ?? 0) > 0 && p.stock <= (p.min_stock ?? 0)).length

  const addToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.notes)
      if (existing) {
        return prev.map(i => 
          i === existing ? { ...i, quantity: i.quantity + qty } : i
        )
      }
      return [...prev, { product, quantity: qty }]
    })
  }

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const item = prev[idx]
      const newQty = item.quantity + delta
      if (newQty <= 0) return prev.filter((_, i) => i !== idx)
      return prev.map((i, index) => index === idx ? { ...i, quantity: newQty } : i)
    })
  }

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  const getCartCount = (productId: number) => 
    cart.filter(i => i.product.id === productId).reduce((s, i) => s + i.quantity, 0)

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const tax = subtotal * 0.13
  const total = subtotal + tax

  const formatDate = () => {
    const d = new Date()
    return d.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  if (loading) {
    return <div className="pos-loading">Cargando...</div>
  }

  return (
    <div className="pos-page">
      <header className="pos-header">
        <div className="pos-header-left">
          <h1 className="pos-logo">
            <Link to="/" className="pos-logo-link">
              <span className="logo-icon">☕</span>
              Cafetería CLEO
            </Link>
          </h1>
          <span className="pos-date">{formatDate()}</span>
        </div>
        <div className="pos-header-right">
          <span className="pos-order-count">Total: {orderCount} pedidos</span>
          <Link to="/reports" className="pos-btn-report">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Reportes
          </Link>
          <div className="pos-notifications">
            <span className="bell-icon">🔔</span>
            {cart.length > 0 && <span className="badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </div>
          <div className="pos-avatar" title={user?.full_name}>
            {user?.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      </header>

      <div className="pos-body">
        <section className="pos-catalog">
          <div className="pos-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="pos-categories">
            {categories.map(cat => {
              const lowCount = getLowStockCount(cat.id)
              const isSelected = selectedCat === cat.id
              return (
                <button
                  key={cat.id}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCat(isSelected ? null : cat.id)}
                >
                  <div className="cat-icon" aria-hidden>📦</div>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-items">
                    {products.filter(p => p.category_id === cat.id).length} items
                  </span>
                  <span className={`cat-status ${lowCount > 0 ? 'restock' : 'available'}`}>
                    {lowCount > 0 ? '⚠️ Reabastecer' : 'Disponible'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="pos-products">
            {filteredProducts.map(p => {
              const qtyInCart = getCartCount(p.id)
              const lowStock = (p.min_stock ?? 0) > 0 && p.stock <= (p.min_stock ?? 0)
              return (
                <div key={p.id} className={`product-card ${lowStock ? 'low-stock' : ''}`}>
                  <div className="product-image">
                    <span className="product-emoji">☕</span>
                  </div>
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-price">₡{Number(p.price).toLocaleString()}</p>
                  {qtyInCart > 0 && <span className="product-badge">{qtyInCart}</span>}
                  <button
                    className="product-add"
                    onClick={() => addToCart(p)}
                    disabled={lowStock && p.stock === 0}
                  >
                    +
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <aside className="pos-order">
          <div className="order-header">
            <h2>Pedido</h2>
            <span className="order-id">#{Date.now().toString().slice(-5)}</span>
          </div>

          <div className="order-type">
            <button
              className={orderType === 'dine_in' ? 'active' : ''}
              onClick={() => setOrderType('dine_in')}
            >
              En local
            </button>
            <button
              className={orderType === 'take_away' ? 'active' : ''}
              onClick={() => setOrderType('take_away')}
            >
              Para llevar
            </button>
          </div>

          <div className="order-fields">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Mesa"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
            />
          </div>

          <div className="order-list">
            {cart.length === 0 ? (
              <p className="order-empty">Añade productos al pedido</p>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="order-item">
                  <div className="order-item-info">
                    <span className="order-item-name">{item.product.name}</span>
                    <span className="order-item-price">
                      ₡{(item.product.price * item.quantity).toLocaleString()} x{item.quantity}
                    </span>
                  </div>
                  <div className="order-item-actions">
                    <button onClick={() => updateCartQty(idx, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateCartQty(idx, 1)}>+</button>
                    <button className="remove" onClick={() => removeFromCart(idx)}>×</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="order-footer">
            <div className="order-totals">
              <div><span>Subtotal</span><span>₡{subtotal.toLocaleString()}</span></div>
              <div><span>IVA 13%</span><span>₡{tax.toLocaleString()}</span></div>
              <div className="total-row"><span>Total</span><span>₡{total.toLocaleString()}</span></div>
            </div>
            <button className="btn-checkout" disabled={cart.length === 0}>
              Cobrar
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
