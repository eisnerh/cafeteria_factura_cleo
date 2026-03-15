import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

interface Reservation {
  id: number;
  client_id: number | null;
  table_id: number | null;
  reserved_date: string;
  guests_count: number;
  notes: string | null;
  status: string;
}

interface Client {
  id: number;
  name: string;
}
interface Table {
  id: number;
  name: string;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    client_id: '' as string | number,
    table_id: '' as string | number,
    reserved_date: '',
    guests_count: 2,
    notes: '',
  });
  const [dateRange, setDateRange] = useState({
    desde: new Date().toISOString().slice(0, 10),
    hasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const loadReservations = () => {
    setLoading(true);
    apiFetch<Reservation[]>(
      `/reservations?desde=${dateRange.desde}&hasta=${dateRange.hasta}`
    )
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReservations();
  }, [dateRange.desde, dateRange.hasta]);

  useEffect(() => {
    apiFetch<Client[]>('/clients').then(setClients).catch(console.error);
    apiFetch<Table[]>('/tables').then(setTables).catch(console.error);
  }, []);

  const handleCreate = async () => {
    await apiFetch('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        client_id: form.client_id ? Number(form.client_id) : null,
        table_id: form.table_id ? Number(form.table_id) : null,
        reserved_date: form.reserved_date + 'T12:00:00',
        guests_count: form.guests_count,
        notes: form.notes || null,
      }),
    });
    setModal(null);
    setForm({ client_id: '', table_id: '', reserved_date: '', guests_count: 2, notes: '' });
    loadReservations();
  };

  const handleEdit = (r: Reservation) => {
    setEditingId(r.id);
    setForm({
      client_id: r.client_id || '',
      table_id: r.table_id || '',
      reserved_date: r.reserved_date?.slice(0, 10) || '',
      guests_count: r.guests_count || 2,
      notes: r.notes || '',
    });
    setModal('edit');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await apiFetch(`/reservations/${editingId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        client_id: form.client_id ? Number(form.client_id) : null,
        table_id: form.table_id ? Number(form.table_id) : null,
        reserved_date: form.reserved_date ? form.reserved_date + 'T12:00:00' : undefined,
        guests_count: form.guests_count,
        notes: form.notes || null,
      }),
    });
    setModal(null);
    setEditingId(null);
    loadReservations();
  };

  const handleCancel = async (id: number) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
    loadReservations();
  };

  return (
    <div className="page reservations-page">
      <div className="page-header">
        <h1>Calendario de Reservas</h1>
        <button className="btn primary" onClick={() => { setForm({ client_id: '', table_id: '', reserved_date: '', guests_count: 2, notes: '' }); setModal('create'); }}>
          + Nueva reserva
        </button>
      </div>
      <div className="filters-row">
        <label>Desde: <input type="date" value={dateRange.desde} onChange={e => setDateRange(r => ({ ...r, desde: e.target.value }))} /></label>
        <label>Hasta: <input type="date" value={dateRange.hasta} onChange={e => setDateRange(r => ({ ...r, hasta: e.target.value }))} /></label>
      </div>
      {loading && <p>Cargando...</p>}
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha / Hora</th>
              <th>Comensales</th>
              <th>Cliente</th>
              <th>Mesa</th>
              <th>Estado</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{new Date(r.reserved_date).toLocaleString()}</td>
                <td>{r.guests_count}</td>
                <td>{clients.find(c => c.id === r.client_id)?.name || r.client_id || '-'}</td>
                <td>{tables.find(t => t.id === r.table_id)?.name ?? (r.table_id ?? '-')}</td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                <td>{r.notes || '-'}</td>
                <td>
                  <button className="btn-sm" onClick={() => handleEdit(r)}>Editar</button>
                  {r.status === 'confirmada' && (
                    <button className="btn-sm btn-danger" onClick={() => handleCancel(r.id)}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nueva reserva</h2>
            <label>Cliente
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">— Sin asignar —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Mesa
              <select value={form.table_id} onChange={e => setForm(f => ({ ...f, table_id: e.target.value }))}>
                <option value="">— Sin asignar —</option>
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>Fecha
              <input type="date" value={form.reserved_date} onChange={e => setForm(f => ({ ...f, reserved_date: e.target.value }))} required />
            </label>
            <label>Comensales
              <input type="number" min={1} value={form.guests_count} onChange={e => setForm(f => ({ ...f, guests_count: Number(e.target.value) }))} />
            </label>
            <label>Notas
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </label>
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleCreate} disabled={!form.reserved_date}>Crear</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Editar reserva</h2>
            <label>Cliente
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                <option value="">— Sin asignar —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Mesa
              <select value={form.table_id} onChange={e => setForm(f => ({ ...f, table_id: e.target.value }))}>
                <option value="">— Sin asignar —</option>
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>Fecha
              <input type="date" value={form.reserved_date} onChange={e => setForm(f => ({ ...f, reserved_date: e.target.value }))} />
            </label>
            <label>Comensales
              <input type="number" min={1} value={form.guests_count} onChange={e => setForm(f => ({ ...f, guests_count: Number(e.target.value) }))} />
            </label>
            <label>Notas
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </label>
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleUpdate}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
