import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface InvoiceItem {
  id: number
  invoice_id: number
  description: string
  quantity: number
  unit_price: number
  subtotal?: number
  tax?: number
}

interface InvoiceDetail {
  id: number
  cliente_id: number | null
  order_id: number | null
  tipo_documento: string
  clave: string | null
  consecutivo: string | null
  estado_hacienda: string | null
  is_simulated: boolean
  total: number | null
  subtotal: number | null
  impuesto: number | null
  created_at: string | null
  items: InvoiceItem[]
}

export default function InvoiceDetail() {
  useAuth()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    api.get<InvoiceDetail>(`/invoices/${id}`)
      .then(r => setInvoice(r.data))
      .catch(() => setError('Factura no encontrada'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (searchParams.get('print') === '1' && invoice) {
      const t = setTimeout(() => window.print(), 500)
      return () => clearTimeout(t)
    }
  }, [invoice, searchParams])

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="page"><p>Cargando...</p></div>
  if (error || !invoice) {
    return (
      <div className="page">
        <p className="alert alert-error">{error}</p>
        <Link to="/invoices" className="btn">Volver a facturas</Link>
      </div>
    )
  }

  const formatMoney = (n: number) => `₡${Number(n).toLocaleString('es-CR', { minimumFractionDigits: 2 })}`

  return (
    <div className="page invoice-detail-page">
      <div className="page-header">
        <h1>{invoice.tipo_documento === 'TE' ? 'Tiquete' : 'Factura'} {invoice.consecutivo || `#${invoice.id}`}</h1>
        <div className="invoice-detail-actions">
          <button type="button" className="btn primary" onClick={handlePrint}>
            🖨️ {invoice.tipo_documento === 'TE' ? 'Imprimir tiquete' : 'Imprimir factura'}
          </button>
          <Link to="/invoices" className="btn">Volver</Link>
        </div>
      </div>

      <div ref={printRef} className="card invoice-print-content">
        <div className="invoice-print-header">
          <h2>COMPROBANTE ELECTRÓNICO</h2>
          <p><strong>{invoice.tipo_documento}</strong> Consecutivo: {invoice.consecutivo || '-'}</p>
          <p className="invoice-print-date">
            Fecha: {invoice.created_at ? new Date(invoice.created_at).toLocaleString('es-CR') : '-'}
          </p>
          {invoice.clave && <p className="invoice-print-clave">Clave: {invoice.clave}</p>}
          {invoice.is_simulated && <p className="invoice-print-simulated">(Modo simulación)</p>}
        </div>

        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unit_price)}</td>
                <td>{formatMoney(Number(item.subtotal ?? item.quantity * item.unit_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-print-totals">
          {invoice.subtotal != null && (
            <div className="invoice-total-row">
              <span>Subtotal</span>
              <strong>{formatMoney(invoice.subtotal)}</strong>
            </div>
          )}
          {invoice.impuesto != null && (
            <div className="invoice-total-row">
              <span>IVA 13%</span>
              <strong>{formatMoney(invoice.impuesto)}</strong>
            </div>
          )}
          <div className="invoice-total-row total">
            <span>Total</span>
            <strong>{formatMoney(invoice.total ?? 0)}</strong>
          </div>
        </div>

        {invoice.order_id && (
          <p className="invoice-print-meta">Pedido asociado: #{invoice.order_id}</p>
        )}
      </div>
    </div>
  )
}
