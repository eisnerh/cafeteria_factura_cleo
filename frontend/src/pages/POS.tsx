import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { useLogoImageSrc } from '../contexts/LogoContext'
import { APP_NAME } from '../config'
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

interface OrderItemRes {
  id: number
  product_id: number
  quantity: number
  unit_price: number
}

interface OrderItemWithProduct extends OrderItemRes {
  product?: { name: string }
}
type PaymentType = 'efectivo' | 'sinpe' | 'tarjeta_credito' | 'tarjeta_debito'

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'sinpe', label: 'Sinpe' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta débito' },
]

interface OrderRes {
  id: number
  status: string
  notes?: string
  payment_type?: string
  items: OrderItemWithProduct[]
}

interface Client {
  id: number
  name: string
}

interface Table {
  id: number
  name: string
  state: string
  capacity: number
}

interface TableItem {
  id: number
  name: string
  state: string
  capacity?: number
}

export default function POS() {
  useAuth()
  const logoImgSrc = useLogoImageSrc()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away'>('dine_in')
  const [customerName, setCustomerName] = useState('')
  const [tableName, setTableName] = useState('')
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTableId, setSelectedTableId] = useState<number | ''>('')
  const [sessionId, setSessionId] = useState<number | null>(null)

  const [posTab, setPosTab] = useState<'ventas' | 'historial'>('ventas')
  const [ordersFilter, setOrdersFilter] = useState('')
  const [allOrders, setAllOrders] = useState<OrderRes[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)

  const loadHistorial = () => {
    setHistorialLoading(true)
    const q = ordersFilter ? `?status=${encodeURIComponent(ordersFilter)}` : ''
    api.get<OrderRes[]>(`/orders${q}`)
      .then(res => setAllOrders(res.data))
      .catch(() => setAllOrders([]))
      .finally(() => setHistorialLoading(false))
  }

  useEffect(() => {
    if (posTab === 'historial') loadHistorial()
  }, [posTab, ordersFilter])
  const [loading, setLoading] = useState(true)
  const [pendingTakeAway, setPendingTakeAway] = useState<OrderRes[]>([])

  // Mesa y tab desde URL (ej. /pos?table=Mesa%201 o ?tab=historial)
  useEffect(() => {
    const table = searchParams.get('table')
    const tab = searchParams.get('tab')
    if (table) {
      setTableName(decodeURIComponent(table))
      setOrderType('dine_in')
    }
    if (tab === 'historial') setPosTab('historial')
  }, [searchParams])

  const fetchPendingTakeAway = () => {
    api.get<OrderRes[]>('/orders', { params: { status: 'pendiente', take_away: true } })
      .then(res => setPendingTakeAway(res.data))
      .catch(() => setPendingTakeAway([]))
  }

  const [currentCashRegisterId, setCurrentCashRegisterId] = useState<number | null>(null)
  const [cajaOpen, setCajaOpen] = useState(false)
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<OrderRes | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [invoiceForm, setInvoiceForm] = useState({ client_id: '' as string | number, tipo_documento: 'FE' as string })
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [cobrarModalOrder, setCobrarModalOrder] = useState<OrderRes | null>(null)
  const [cobrarAndThenFacturar, setCobrarAndThenFacturar] = useState(false)
  const [cobrarForm, setCobrarForm] = useState({
    payment_type: 'efectivo' as PaymentType,
    amount_received: '',
  })
  const [cobrarLoading, setCobrarLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/inventory/categories').catch(() => ({ data: [] as Category[] })),
      api.get<Product[]>('/inventory/products').catch(() => ({ data: [] as Product[] })),
      api.get<unknown[]>('/orders').catch(() => ({ data: [] as unknown[] })),
      api.get<{ open: boolean; session: { id: number } | null }>('/cash-register/current').catch(() => ({ data: { open: false, session: null } })),
      api.get<Table[]>('/tables').catch(() => ({ data: [] as Table[] })),
    ]).then(([catRes, prodRes, , cajaRes, tblRes]) => {
      setCategories(catRes.data)
      setProducts(prodRes.data)
      setCurrentCashRegisterId(cajaRes.data?.open && cajaRes.data?.session ? cajaRes.data.session.id : null)
      setCajaOpen(!!(cajaRes.data?.open))
      setTables(Array.isArray(tblRes.data) ? tblRes.data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
    fetchPendingTakeAway()
  }, [])

  const handleTableSelect = async (tableId: number | '') => {
    setSelectedTableId(tableId)
    setSessionId(null)
    if (!tableId) return
    const table = tables.find(t => t.id === tableId)
    if (!table) return
    try {
      if (table.state === 'libre') {
        const { data } = await api.post<{ id: number }>(`/tables/${tableId}/sessions`, {
          table_id: tableId,
          guests_count: 0,
        })
        setSessionId(data.id)
      } else {
        const { data } = await api.get<{ session_id: number }>(`/tables/${tableId}/open-session`)
        setSessionId(data.session_id)
      }
    } catch {
      setSelectedTableId('')
      alert('No se pudo asignar la mesa. Intente de nuevo.')
    }
  }

  const openInvoiceModal = (order: OrderRes) => {
    setInvoiceModalOrder(order)
    setInvoiceForm({ client_id: '', tipo_documento: 'FE' })
    api.get<Client[]>('/clients').then(r => setClients(r.data)).catch(() => setClients([]))
  }

  const handleCreateInvoice = async () => {
    if (!invoiceModalOrder) return
    setInvoiceLoading(true)
    try {
      const { data } = await api.post<{ id: number; tipo_documento: string }>('/invoices', {
        order_id: invoiceModalOrder.id,
        cliente_id: invoiceForm.client_id ? Number(invoiceForm.client_id) : null,
        tipo_documento: invoiceForm.tipo_documento,
      })
      setInvoiceModalOrder(null)
      alert('Factura generada correctamente')
      if (invoiceForm.tipo_documento === 'TE') {
        const printUrl = `${window.location.origin}/invoices/${data.id}?print=1`
        const win = window.open(printUrl, '_blank', 'width=800,height=600')
        if (win) win.focus()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al facturar')
    } finally {
      setInvoiceLoading(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchCat = !selectedCat || p.category_id === selectedCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const addToCart = (product: Product, qty = 1) => {
    const safeQty = Math.max(1, qty)
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id && !i.notes)
      if (existing) {
        return prev.map(i => 
          i === existing ? { ...i, quantity: i.quantity + safeQty } : i
        )
      }
      return [...prev, { product, quantity: safeQty }]
    })
  }

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => {
      const item = prev[idx]
      const newQty = Math.max(0, item.quantity + delta)
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

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (orderType === 'dine_in' && !selectedTableId) {
      setCheckoutError('Selecciona una mesa antes de registrar el pedido')
      return
    }
    setCheckoutError('')
    setCheckoutLoading(true)
    try {
      let notes: string | undefined
      const selectedTable = tables.find(t => t.id === selectedTableId)
      if (orderType === 'take_away') {
        const name = customerName.trim() || 'Sin nombre'
        notes = `PARA_LLEVAR:${name}`
      } else {
        notes = [customerName, selectedTable?.name].filter(Boolean).join(' | ') || undefined
      }
      const body = {
        session_id: orderType === 'dine_in' ? sessionId : null,
        client_id: null,
        cash_register_id: currentCashRegisterId ?? undefined,
        notes,
        items: cart.map(i => ({
          product_id: i.product.id,
          quantity: Math.max(0, i.quantity),
          unit_price: Math.max(0, i.product.price),
          notes: i.notes,
          split_group: 1,
        })),
      }
      const { data } = await api.post<{ id: number }>('/orders', body)
      setCart([])
      setCustomerName('')
      setTableName('')
      setSelectedTableId('')
      setSessionId(null)
      api.get<Table[]>('/tables').then(r => setTables(r.data)).catch(() => {})
      loadHistorial()
      if (orderType === 'take_away') {
        fetchPendingTakeAway()
        alert(`Pedido #${data.id} agregado a la lista de para llevar.`)
      } else {
        alert(`Pedido #${data.id} registrado correctamente.`)
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al registrar pedido')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const openCobrarModal = (order: OrderRes, andThenFacturar = false) => {
    setCobrarModalOrder(order)
    setCobrarAndThenFacturar(andThenFacturar)
    setCobrarForm({
      payment_type: 'efectivo',
      amount_received: String(getOrderTotal(order)),
    })
  }

  const handleConfirmCobrar = async () => {
    if (!cobrarModalOrder) return
    const total = getOrderTotal(cobrarModalOrder)
    if (cobrarForm.payment_type === 'efectivo') {
      const received = parseFloat(cobrarForm.amount_received)
      if (isNaN(received) || received < total) {
        alert('El monto recibido debe ser mayor o igual al total')
        return
      }
    }
    setCobrarLoading(true)
    try {
      await api.patch(`/orders/${cobrarModalOrder.id}`, {
        status: 'cobrado',
        payment_type: cobrarForm.payment_type,
      })
      setCobrarModalOrder(null)
      fetchPendingTakeAway()
      loadHistorial()
      if (cobrarAndThenFacturar) {
        openInvoiceModal({ ...cobrarModalOrder, status: 'cobrado' })
      }
    } catch {
      alert('Error al cobrar')
    } finally {
      setCobrarLoading(false)
    }
  }

  const getOrderTotal = (o: OrderRes) =>
    o.items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0)

  const getCustomerFromNotes = (notes?: string) => {
    if (!notes?.startsWith('PARA_LLEVAR:')) return '-'
    return notes.replace('PARA_LLEVAR:', '').trim() || 'Sin nombre'
  }

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
              {logoImgSrc ? (
                <img src={logoImgSrc} alt={APP_NAME} className="pos-logo-img" />
              ) : (
                <>
                  <span className="logo-icon">☕</span>
                  {APP_NAME}
                </>
              )}
            </Link>
          </h1>
          <span className="pos-date">{formatDate()}</span>
        </div>
        <div className="pos-header-right">
          {cart.length > 0 && (
            <span className="pos-cart-badge">{cart.reduce((s, i) => s + i.quantity, 0)} en pedido</span>
          )}
          <Link to="/" className="pos-btn-home">🏠</Link>
        </div>
      </header>

      <div className="pos-tabs">
        <button className={posTab === 'ventas' ? 'active' : ''} onClick={() => { setPosTab('ventas'); setSearchParams((p) => { p.delete('tab'); return p; }); }}>Ventas</button>
        <button className={posTab === 'historial' ? 'active' : ''} onClick={() => { setPosTab('historial'); setSearchParams({ tab: 'historial' }); }}>Historial</button>
      </div>

      {posTab === 'historial' ? (
        <div className="pos-historial">
          <div className="pos-historial-header">
            <select value={ordersFilter} onChange={e => setOrdersFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_preparacion">En preparación</option>
            <option value="entregado">Entregados</option>
            <option value="cobrado">Cobrados</option>
          </select>
            {!cajaOpen && (
              <Link to="/cash-register" className="btn primary pos-btn-abrir-caja">
                Abrir caja
              </Link>
            )}
          </div>
          {historialLoading ? (
            <p>Cargando pedidos...</p>
          ) : (
            <div className="orders-list">
              {allOrders.map(o => (
                <div key={o.id} className="order-card">
                  <div className="order-header">
                    <span>#{o.id}</span>
                    <span className={`badge status-${o.status}`}>{o.status}</span>
                  </div>
                  {o.items?.length ? (
                    <ul className="order-items">
                      {o.items.map((i: OrderItemWithProduct) => (
                        <li key={i.id}>{i.product?.name || 'Producto'} x {i.quantity} - ₡{(Number(i.quantity) * Number(i.unit_price)).toFixed(2)}</li>
                      ))}
                    </ul>
                  ) : <p>Sin ítems</p>}
                  <p className="total">Total: ₡{o.items?.reduce((s: number, i: OrderItemWithProduct) => s + Number(i.quantity) * Number(i.unit_price), 0).toFixed(2) || '0.00'}</p>
                  <div className="order-card-actions">
                    {(o.status === 'entregado' || o.status === 'pendiente') && (
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => openCobrarModal(o, true)}
                      >
                        Cobrar y facturar
                      </button>
                    )}
                    {o.status === 'cobrado' && (
                      <button className="btn-sm btn-primary" onClick={() => openInvoiceModal(o)}>
                        Facturar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="pos-body">
        <section className="pos-catalog">
          <div className="pos-search">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="pos-categories">
            <button
              className={`category-card ${selectedCat === null ? 'selected' : ''}`}
              onClick={() => setSelectedCat(null)}
            >
              Todos
            </button>
            {categories.map(cat => {
              const isSelected = selectedCat === cat.id
              return (
                <button
                  key={cat.id}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCat(isSelected ? null : cat.id)}
                >
                  {cat.name}
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
              onClick={() => {
                setOrderType('dine_in')
              }}
            >
              Consumir aquí
            </button>
            <button
              className={orderType === 'take_away' ? 'active' : ''}
              onClick={() => {
                setOrderType('take_away')
                setSelectedTableId('')
                setSessionId(null)
              }}
            >
              Para llevar
            </button>
          </div>

          <div className="order-fields">
            <label>Cliente {orderType === 'dine_in' ? '/ Mesa' : ''}</label>
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            {orderType === 'dine_in' && (
              <>
                <label>Mesa</label>
                <select
                  value={selectedTableId}
                  onChange={e => {
                    const val = e.target.value
                    handleTableSelect(val === '' ? '' : Number(val))
                  }}
                >
                  <option value="">Seleccione una mesa</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.state})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="order-list">
            {cart.length === 0 ? (
              <p className="order-empty">Toca un producto para agregar</p>
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
            {checkoutError && <div className="pos-checkout-error">{checkoutError}</div>}
            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
            >
              {checkoutLoading
                ? 'Un momento...'
                : orderType === 'take_away'
                  ? 'Guardar'
                  : 'Cobrar'}
            </button>
          </div>

          {pendingTakeAway.length > 0 && (
            <div className="pos-pending-panel">
              <h3>Listos para cobrar</h3>
              <ul className="pos-pending-list">
                {pendingTakeAway.map(o => (
                  <li key={o.id} className="pos-pending-item">
                    <div className="pos-pending-info">
                      <span className="pos-pending-id">#{o.id}</span>
                      <span className="pos-pending-name">{getCustomerFromNotes(o.notes)}</span>
                      <span className="pos-pending-total">₡{getOrderTotal(o).toLocaleString()}</span>
                    </div>
                    <button
                      className="pos-pending-cobrar"
                      onClick={() => openCobrarModal(o, false)}
                    >
                      Cobrar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      )}

      {cobrarModalOrder && (
        <div className="modal-overlay" onClick={() => setCobrarModalOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Cobrar pedido #{cobrarModalOrder.id}</h2>
            <p className="modal-desc">Total: ₡{getOrderTotal(cobrarModalOrder).toLocaleString()}</p>
            <label>Tipo de pago</label>
            <select
              value={cobrarForm.payment_type}
              onChange={e => setCobrarForm(f => ({ ...f, payment_type: e.target.value as PaymentType }))}
            >
              {PAYMENT_TYPES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {cobrarForm.payment_type === 'efectivo' && (
              <>
                <label>Monto recibido</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ejem: 10000"
                  value={cobrarForm.amount_received}
                  onChange={e => {
                    const val = e.target.value
                    const num = parseFloat(val)
                    if (val === '' || val === '-') {
                      setCobrarForm(f => ({ ...f, amount_received: val }))
                    } else if (!isNaN(num) && num >= 0) {
                      setCobrarForm(f => ({ ...f, amount_received: val }))
                    }
                  }}
                />
                {(() => {
                  const received = parseFloat(cobrarForm.amount_received)
                  const total = getOrderTotal(cobrarModalOrder)
                  if (cobrarForm.amount_received && !isNaN(received)) {
                    if (received < total) {
                      return <p className="modal-falta" style={{ color: '#c00', fontWeight: 'bold' }}>Falta: ₡{(total - received).toLocaleString()}</p>
                    }
                    return <p className="modal-vuelto">Vuelto: ₡{(received - total).toLocaleString()}</p>
                  }
                  return null
                })()}
              </>
            )}
            <div className="modal-actions">
              <button onClick={() => setCobrarModalOrder(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleConfirmCobrar} disabled={cobrarLoading}>
                {cobrarLoading ? 'Cobrando...' : cobrarAndThenFacturar ? 'Cobrar y facturar' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceModalOrder && (
        <div className="modal-overlay" onClick={() => setInvoiceModalOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Facturar pedido #{invoiceModalOrder.id}</h2>
            <p className="modal-desc">Total: ₡{getOrderTotal(invoiceModalOrder).toLocaleString()}</p>
            <label>Cliente (opcional)</label>
            <select
              value={invoiceForm.client_id}
              onChange={e => setInvoiceForm(f => ({ ...f, client_id: e.target.value }))}
            >
              <option value="">Consumidor final</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label>Tipo de documento</label>
            <select
              value={invoiceForm.tipo_documento}
              onChange={e => setInvoiceForm(f => ({ ...f, tipo_documento: e.target.value }))}
            >
              <option value="FE">Factura electrónica</option>
              <option value="TE">Tiquete electrónico</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setInvoiceModalOrder(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleCreateInvoice} disabled={invoiceLoading}>
                {invoiceLoading ? 'Generando...' : 'Facturar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
