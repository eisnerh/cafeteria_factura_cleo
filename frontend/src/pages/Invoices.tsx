import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

interface Invoice {
  id: number;
  clave: string | null;
  consecutivo: string | null;
  tipo_documento: string;
  estado_hacienda: string | null;
  is_simulated: boolean;
  total: number | null;
  created_at: string | null;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Invoice[]>('/invoices?limit=50')
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page invoices-page">
      <h1>Facturación Electrónica</h1>
      <p className="subtitle">Documentos emitidos (Hacienda CR - modo simulación en desarrollo)</p>
      {loading && <p>Cargando...</p>}
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Clave</th>
              <th>Consecutivo</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Simulado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td className="mono">{inv.clave?.slice(0, 20)}...</td>
                <td>{inv.consecutivo}</td>
                <td>{inv.tipo_documento}</td>
                <td>{inv.estado_hacienda}</td>
                <td>₡{Number(inv.total || 0).toLocaleString()}</td>
                <td>{inv.is_simulated ? 'Sí' : 'No'}</td>
                <td>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
