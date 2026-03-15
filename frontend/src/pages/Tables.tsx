import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './Tables.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Icono SVG de mesa (vista superior) como placeholder cuando no hay imagen */
const TablePlaceholder = ({ state }: { state: string }) => (
  <svg viewBox="0 0 80 60" className="table-placeholder-svg" aria-hidden>
    <rect x="5" y="15" width="70" height="30" rx="4" fill="currentColor" opacity={state === 'libre' ? 0.9 : 0.7} />
    <ellipse cx="15" cy="10" rx="6" ry="4" fill="currentColor" opacity={0.6} />
    <ellipse cx="65" cy="10" rx="6" ry="4" fill="currentColor" opacity={0.6} />
    <ellipse cx="15" cy="50" rx="6" ry="4" fill="currentColor" opacity={0.6} />
    <ellipse cx="65" cy="50" rx="6" ry="4" fill="currentColor" opacity={0.6} />
  </svg>
);

interface Table {
  id: number;
  name: string;
  capacity: number;
  state: string;
  position_x?: number;
  position_y?: number;
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', capacity: 4, state: 'libre' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [tableImageKey, setTableImageKey] = useState(0);
  const tableFileRef = useRef<HTMLInputElement>(null);

  const tableImgUrl = (id: number) => `${API_BASE}/tables/${id}/image?t=${tableImageKey}`;

  const handleTableImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, tableId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.upload(`/tables/${tableId}/image`, fd);
    setTableImageKey(k => k + 1);
    if (tableFileRef.current) tableFileRef.current.value = '';
  };

  const handleTableImageDelete = async (tableId: number) => {
    if (!confirm('¿Eliminar imagen?')) return;
    await api.delete(`/tables/${tableId}/image`);
    setTableImageKey(k => k + 1);
  };

  useEffect(() => {
    api.get<Table[]>('/tables').then(({ data }) => setTables(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadTables = () => api.get<Table[]>('/tables').then(({ data }) => setTables(data)).catch(console.error);

  const handleCreate = async () => {
    await api.post('/tables', { ...form, position_x: 0, position_y: 0 });
    setModal(null);
    setForm({ name: '', capacity: 4, state: 'libre' });
    loadTables();
  };

  const handleEdit = (t: Table) => {
    setEditingId(t.id);
    setForm({ name: t.name, capacity: t.capacity, state: t.state });
    setModal('edit');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await api.patch(`/tables/${editingId}`, { ...form, position_x: 0, position_y: 0 });
    setModal(null);
    setEditingId(null);
    setForm({ name: '', capacity: 4, state: 'libre' });
    loadTables();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tables/${id}`);
    setDeleteConfirm(null);
    loadTables();
  };

  return (
    <div className="page tables-page">
      <div className="page-header">
        <h1>Mesas</h1>
        <button className="btn primary" onClick={() => { setForm({ name: '', capacity: 4, state: 'libre' }); setModal('create'); }}>
          + Nueva mesa
        </button>
      </div>
      {loading ? (
        <p className="tables-loading">Cargando mesas...</p>
      ) : (
        <>
          <div className="tables-legend">
            <span className="tables-legend-item"><span className="tables-legend-dot libre" /> Libre</span>
            <span className="tables-legend-item"><span className="tables-legend-dot ocupada" /> Ocupada</span>
            <span className="tables-legend-item"><span className="tables-legend-dot reservada" /> Reservada</span>
          </div>
          <div className="tables-grid">
            {tables.map((t) => (
              <div key={t.id} className={`tables-table-card state-${t.state}`}>
                <div className="tables-card-image">
                  <img
                    src={tableImgUrl(t.id)}
                    alt={`Mesa ${t.name}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const place = e.currentTarget.nextElementSibling;
                      if (place) (place as HTMLElement).style.display = 'flex';
                    }}
                  />
                  <div className="table-placeholder" style={{ display: 'none' }}>
                    <TablePlaceholder state={t.state} />
                  </div>
                  <span className={`tables-state-badge ${t.state}`}>{t.state}</span>
                </div>
                <div className="tables-card-body">
                  <span className="tables-card-name">{t.name}</span>
                  <span className="tables-card-capacity">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                    {t.capacity} personas
                  </span>
                  <div className="tables-card-actions">
                    <button className="btn-sm" onClick={() => handleEdit(t)}>Editar</button>
                    {t.state === 'libre' && (
                      <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm(t.id)}>Eliminar</button>
                    )}
                  </div>
                  {deleteConfirm === t.id && (
                    <div className="tables-confirm-box">
                      <span>¿Eliminar mesa?</span>
                      <button className="btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Sí</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva mesa</h2>
            <input placeholder="Nombre *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input type="number" placeholder="Capacidad" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 4 }))} />
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleCreate} disabled={!form.name}>Crear</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Editar mesa</h2>
            <input placeholder="Nombre *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input type="number" placeholder="Capacidad" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 4 }))} />
            <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}>
              <option value="libre">Libre</option>
              <option value="ocupada">Ocupada</option>
              <option value="reservada">Reservada</option>
            </select>
            {editingId && (
              <div className="form-image-section">
                <label>Imagen de la mesa</label>
                <div className="image-preview-row">
                  <img src={tableImgUrl(editingId)} alt="" className="entity-preview-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="image-actions">
                    <input ref={tableFileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg" className="file-input hidden" onChange={(e) => handleTableImageUpload(e, editingId)} />
                    <button type="button" className="btn-sm" onClick={() => tableFileRef.current?.click()}>Subir/Cambiar</button>
                    <button type="button" className="btn-sm btn-danger" onClick={() => handleTableImageDelete(editingId)}>Eliminar imagen</button>
                  </div>
                </div>
              </div>
            )}
            <div className="modal-actions modal-actions-tables">
              <Link
                to={`/pos?table=${encodeURIComponent(form.name)}`}
                className="btn btn-accent"
                onClick={() => setModal(null)}
              >
                Realizar pedido
              </Link>
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleUpdate} disabled={!form.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
