import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';

interface Invoice {
  id: number;
  order_id?: number | null;
  clave: string | null;
  consecutivo: string | null;
  tipo_documento: string;
  estado_hacienda: string | null;
  is_simulated: boolean;
  total: number | null;
  created_at: string | null;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<Invoice[]>('/invoices?limit=100')
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter(inv => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      String(inv.id).includes(s) ||
      (inv.order_id && String(inv.order_id).includes(s)) ||
      (inv.clave?.toLowerCase().includes(s)) ||
      (inv.consecutivo?.toLowerCase().includes(s)) ||
      (inv.tipo_documento?.toLowerCase().includes(s))
    );
  });

  return (
    <div className="page invoices-page">
      <h1>Facturación Electrónica</h1>
      <p className="subtitle">Documentos emitidos (Hacienda CR - modo simulación en desarrollo)</p>
      <div className="invoices-actions">
        <input
          type="search"
          placeholder="Buscar por ID, pedido, clave, tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="invoices-search"
        />
        <Link to="/pos?tab=historial" className="btn primary">Cobrar y facturar desde POS</Link>
      </div>
      {loading && <p>Cargando...</p>}
      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <p className="empty-state-icon">📄</p>
          <p className="empty-state-title">Sin facturas</p>
          <p className="empty-state-desc">Las facturas se crean desde el historial de pedidos cuando cobras.</p>
          <Link to="/pos?tab=historial" className="btn primary">Ir a Historial</Link>
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Pedido</th>
                <th>Clave</th>
                <th>Consecutivo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Simulado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="clickable-row" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td><Link to={`/invoices/${inv.id}`} className="link-mono" onClick={e => e.stopPropagation()}>{inv.id}</Link></td>
                  <td>
                    {inv.order_id ? (
                      <Link to={`/pos?tab=historial`} className="link-mono">#{inv.order_id}</Link>
                    ) : '-'}
                  </td>
                  <td className="mono">{inv.clave ? `${inv.clave.slice(0, 16)}...` : '-'}</td>
                  <td>{inv.consecutivo || '-'}</td>
                  <td>{inv.tipo_documento}</td>
                  <td>{inv.estado_hacienda || '-'}</td>
                  <td>₡{Number(inv.total || 0).toLocaleString()}</td>
                  <td>{inv.is_simulated ? 'Sí' : 'No'}</td>
                  <td>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="btn btn-sm"
                      title="Ver detalle"
                    >
                      Ver
                    </Link>
                    <a
                      href={`/invoices/${inv.id}?print=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm primary"
                      title="Imprimir factura"
                      onClick={e => e.stopPropagation()}
                    >
                      🖨️ Imprimir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
