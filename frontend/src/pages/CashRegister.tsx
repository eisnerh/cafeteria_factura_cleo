import { useState, useEffect } from 'react'
import api from '../api/client'
import './CashRegister.css'

interface CashSession {
  id: number
  opened_at: string
  opening_balance: number
  sales?: number
  expenses?: number
  expected_balance?: number
}

interface CurrentStatus {
  open: boolean
  session: CashSession | null
}

interface ClosedSession {
  id: number
  user_id: number
  opened_at: string
  closed_at: string | null
  opening_balance: number
  closing_balance: number | null
  expected_balance: number | null
  difference: number | null
  notes: string | null
}

interface SessionDetail {
  session: {
    id: number
    opened_at: string
    closed_at: string | null
    opening_balance: number
    closing_balance: number | null
    expected_balance: number | null
    sales_total: number
    expenses_total: number
  }
  orders: { id: number; total: number; payment_type: string; updated_at: string | null }[]
  expenses: { id: number; amount: number; description: string; payment_type: string }[]
}

export default function CashRegister() {
  const [status, setStatus] = useState<CurrentStatus | null>(null)
  const [history, setHistory] = useState<ClosedSession[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [openBalance, setOpenBalance] = useState('0')
  const [closeBalance, setCloseBalance] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [detailSessionId, setDetailSessionId] = useState<number | null>(null)
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadStatus = () => {
    api.get<CurrentStatus>('/cash-register/current')
      .then(res => setStatus(res.data))
      .catch(() => setStatus({ open: false, session: null }))
  }

  const loadHistory = () => {
    api.get<ClosedSession[]>('/cash-register')
      .then(res => setHistory(res.data))
      .catch(() => setHistory([]))
  }

  const applySuggestedOpening = () => {
    api.get<{ suggested_balance: number }>('/cash-register/suggested-opening')
      .then(res => setOpenBalance(String(res.data.suggested_balance)))
      .catch(() => {})
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<CurrentStatus>('/cash-register/current').then(r => r.data).catch(() => ({ open: false, session: null })),
      api.get<ClosedSession[]>('/cash-register').then(r => r.data).catch(() => []),
    ]).then(([s, h]) => {
      setStatus(s)
      setHistory(h)
    }).finally(() => setLoading(false))
  }, [])

  const handleOpen = async () => {
    setError('')
    setSubmitting(true)
    try {
      await api.post('/cash-register', { opening_balance: parseFloat(openBalance) || 0 })
      setOpenModal(false)
      setOpenBalance('0')
      loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir caja')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!status?.session) return
    const bal = parseFloat(closeBalance)
    if (isNaN(bal)) {
      setError('Ingresa el monto contado')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/cash-register/${status.session.id}/close`, {
        closing_balance: bal,
        notes: closeNotes || undefined,
      })
      setCloseModal(false)
      setCloseBalance('')
      setCloseNotes('')
      loadStatus()
      loadHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar caja')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const formatMoney = (n: number) => `₡${n.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`

  const openDetail = (sessionId: number) => {
    setDetailSessionId(sessionId)
    setDetail(null)
    setDetailLoading(true)
    api.get<SessionDetail>(`/cash-register/${sessionId}/detail`)
      .then(res => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }

  const PAYMENT_LABELS: Record<string, string> = {
    efectivo: 'Efectivo',
    sinpe: 'Sinpe',
    tarjeta_credito: 'Tarjeta crédito',
    tarjeta_debito: 'Tarjeta débito',
  }

  if (loading) {
    return <div className="page"><p>Cargando...</p></div>
  }

  return (
    <div className="page cash-register-page">
      <div className="page-header">
        <h1>💰 Caja</h1>
        <div className="cash-register-actions">
          {status?.open ? (
            <button className="btn btn-danger" onClick={() => setCloseModal(true)}>
              Cerrar caja
            </button>
          ) : (
            <button className="btn primary" onClick={() => setOpenModal(true)}>
              Abrir caja
            </button>
          )}
        </div>
      </div>

      {status?.open && status.session && (
        <div className="card cash-register-status-card">
          <div className="card-header-row">
            <h2>Caja abierta</h2>
            <button type="button" className="btn btn-sm" onClick={() => openDetail(status.session!.id)}>
              Ver detalle
            </button>
          </div>
          <div className="cash-register-stats">
            <div className="stat-row">
              <span>Apertura</span>
              <strong>{formatDate(status.session.opened_at)}</strong>
            </div>
            <div className="stat-row">
              <span>Monto inicial</span>
              <strong>{formatMoney(status.session.opening_balance)}</strong>
            </div>
            <div className="stat-row">
              <span>Ventas (cobradas)</span>
              <strong className="sales">{formatMoney(status.session.sales ?? 0)}</strong>
            </div>
            <div className="stat-row">
              <span>Gastos</span>
              <strong className="expenses">{formatMoney(status.session.expenses ?? 0)}</strong>
            </div>
            <div className="stat-row total">
              <span>Esperado en caja</span>
              <strong>{formatMoney(status.session.expected_balance ?? 0)}</strong>
            </div>
          </div>
        </div>
      )}

      {!status?.open && (
        <div className="card cash-register-closed-hint">
          <p>No hay caja abierta. Pulsa "Abrir caja" para empezar.</p>
        </div>
      )}

      <div className="card cash-register-history">
        <h2>Cierres anteriores</h2>
        {history.length === 0 ? (
          <p className="no-history">Sin registros</p>
        ) : (
          <div className="history-list">
            {history.map(h => (
              <div key={h.id} className="history-item">
                <div className="history-main">
                  <button type="button" className="btn btn-sm history-detail-btn" onClick={() => openDetail(h.id)}>
                    Ver detalle
                  </button>
                  <span className="history-id">#{h.id}</span>
                  <span className="history-date">{formatDate(h.opened_at)}</span>
                  {h.closed_at && (
                    <span className="history-closed">→ {formatDate(h.closed_at)}</span>
                  )}
                </div>
                <div className="history-amounts">
                  <span>Inicial: {formatMoney(h.opening_balance)}</span>
                  {h.closing_balance != null && (
                    <>
                      <span>Contado: {formatMoney(h.closing_balance)}</span>
                      <span>Esperado: {formatMoney(h.expected_balance ?? 0)}</span>
                      {h.difference != null && (
                        <span className={`cash-diff-badge ${h.difference === 0 ? 'diff-zero' : h.difference > 0 ? 'diff-surplus' : 'diff-short'}`}>
                          {h.difference === 0
                            ? '✓ Cuadra'
                            : h.difference > 0
                              ? `Sobrante: ${formatMoney(h.difference)}`
                              : `Faltante: ${formatMoney(-h.difference)}`}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {h.notes && <p className="history-notes">{h.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {openModal && (
        <div className="modal-overlay" onClick={() => setOpenModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Abrir caja</h2>
            <p className="modal-desc">¿Con cuánto dinero empiezas hoy?</p>
            <button type="button" className="btn btn-sm mb-2" onClick={applySuggestedOpening}>
              Usar sugerencia (cierre anterior)
            </button>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 50000"
              value={openBalance}
              onChange={e => setOpenBalance(e.target.value)}
            />
            {error && <div className="alert alert-error">{error}</div>}
            <div className="modal-actions">
              <button onClick={() => setOpenModal(false)}>Cancelar</button>
              <button className="btn primary" onClick={handleOpen} disabled={submitting}>
                {submitting ? 'Abriendo...' : 'Abrir caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {closeModal && status?.session && (
        <div className="modal-overlay" onClick={() => setCloseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Cerrar caja</h2>
            <p className="modal-desc">
              Esperado en caja: <strong>{formatMoney(status.session.expected_balance ?? 0)}</strong>
              <br />
              Cuenta el dinero e ingresa lo que hay:
            </p>
            <input
              type="number"
              step="0.01"
              placeholder="Lo que contaste"
              value={closeBalance}
              onChange={e => setCloseBalance(e.target.value)}
            />
            {closeBalance !== '' && (() => {
              const counted = parseFloat(closeBalance)
              const expected = status.session?.expected_balance ?? 0
              const diff = !isNaN(counted) ? counted - expected : null
              if (diff === null) return null
              return (
                <div className={`cash-close-preview ${diff === 0 ? 'diff-zero' : diff > 0 ? 'diff-surplus' : 'diff-short'}`}>
                  {diff === 0
                    ? '✓ Cuadra en cero'
                    : diff > 0
                      ? `Sobrante: ${formatMoney(diff)}`
                      : `Faltante: ${formatMoney(-diff)}`}
                </div>
              )
            })()}
            <input
              type="text"
              placeholder="Notas (opcional)"
              value={closeNotes}
              onChange={e => setCloseNotes(e.target.value)}
            />
            {error && <div className="alert alert-error">{error}</div>}
            <div className="modal-actions">
              <button onClick={() => setCloseModal(false)}>Cancelar</button>
              <button className="btn primary" onClick={handleClose} disabled={submitting}>
                {submitting ? 'Cerrando...' : 'Cerrar caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailSessionId !== null && (
        <div className="modal-overlay" onClick={() => setDetailSessionId(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h2>Detalle de sesión #{detailSessionId}</h2>
            {detailLoading && <p>Cargando...</p>}
            {!detailLoading && detail && (
              <>
                <div className="cash-detail-summary">
                  <div className="stat-row"><span>Apertura</span><strong>{formatDate(detail.session.opened_at)}</strong></div>
                  {detail.session.closed_at && (
                    <div className="stat-row"><span>Cierre</span><strong>{formatDate(detail.session.closed_at)}</strong></div>
                  )}
                  <div className="stat-row"><span>Monto inicial</span><strong>{formatMoney(detail.session.opening_balance)}</strong></div>
                  <div className="stat-row"><span>Ventas totales</span><strong className="sales">{formatMoney(detail.session.sales_total)}</strong></div>
                  <div className="stat-row"><span>Gastos totales</span><strong className="expenses">{formatMoney(detail.session.expenses_total)}</strong></div>
                  <div className="stat-row total"><span>Esperado en caja</span><strong>{formatMoney(detail.session.expected_balance ?? 0)}</strong></div>
                </div>
                <div className="cash-detail-grid">
                  <div className="cash-detail-section">
                    <h3>Ventas ({detail.orders.length})</h3>
                    <ul className="cash-detail-list">
                      {detail.orders.map(o => (
                        <li key={o.id}>
                          <span>#{o.id}</span>
                          <span>{PAYMENT_LABELS[o.payment_type] || o.payment_type}</span>
                          <strong>{formatMoney(o.total)}</strong>
                        </li>
                      ))}
                      {detail.orders.length === 0 && <li className="empty">Sin ventas</li>}
                    </ul>
                  </div>
                  <div className="cash-detail-section">
                    <h3>Gastos ({detail.expenses.length})</h3>
                    <ul className="cash-detail-list">
                      {detail.expenses.map(e => (
                        <li key={e.id}>
                          <span>{e.description}</span>
                          <span>{PAYMENT_LABELS[e.payment_type] || e.payment_type}</span>
                          <strong>{formatMoney(e.amount)}</strong>
                        </li>
                      ))}
                      {detail.expenses.length === 0 && <li className="empty">Sin gastos</li>}
                    </ul>
                  </div>
                </div>
                <div className="modal-actions">
                  <button onClick={() => setDetailSessionId(null)}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
