import { useState, useEffect } from 'react';
import api, { apiFetch } from '../api/client';

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
  const [form, setForm] = useState({ name: '', capacity: 4, state: 'libre', position_x: 0, position_y: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    api.get<Table[]>('/tables').then(({ data }) => setTables(data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadTables = () => api.get<Table[]>('/tables').then(({ data }) => setTables(data)).catch(console.error);

  const handleCreate = async () => {
    await api.post('/tables', { ...form, position_x: Number(form.position_x), position_y: Number(form.position_y) });
    setModal(null);
    setForm({ name: '', capacity: 4, state: 'libre', position_x: 0, position_y: 0 });
    loadTables();
  };

  const handleEdit = (t: Table) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      capacity: t.capacity,
      state: t.state,
      position_x: t.position_x ?? 0,
      position_y: t.position_y ?? 0,
    });
    setModal('edit');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    await api.patch(`/tables/${editingId}`, { ...form, position_x: Number(form.position_x), position_y: Number(form.position_y) });
    setModal(null);
    setEditingId(null);
    setForm({ name: '', capacity: 4, state: 'libre', position_x: 0, position_y: 0 });
    loadTables();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tables/${id}`);
    setDeleteConfirm(null);
    loadTables();
  };

  const getStateColor = (s: string) => {
    if (s === 'libre') return 'green';
    if (s === 'ocupada') return 'orange';
    return 'gray';
  };

  return (
    <div className="page tables-page">
      <div className="page-header">
        <h1>Mesas</h1>
        <button className="btn primary" onClick={() => { setForm({ name: '', capacity: 4, state: 'libre', position_x: 0, position_y: 0 }); setModal('create'); }}>
          + Nueva mesa
        </button>
      </div>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="tables-map">
          {tables.map((t) => (
            <div
              key={t.id}
              className={`table-card state-${t.state}`}
              style={{ left: (t.position_x || 0) * 2, top: (t.position_y || 0) * 2 }}
            >
              <div className="table-card-content">
                <span className="name">{t.name}</span>
                <span className="capacity">{t.capacity} pers.</span>
                <span className="state" style={{ backgroundColor: getStateColor(t.state) }}>{t.state}</span>
                <div className="card-actions">
                  <button className="btn-sm" onClick={() => handleEdit(t)}>Editar</button>
                  {t.state === 'libre' && (
                    <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm(t.id)}>Eliminar</button>
                  )}
                </div>
                {deleteConfirm === t.id && (
                  <div className="confirm-box">
                    <span>¿Eliminar?</span>
                    <button className="btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Sí</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva mesa</h2>
            <input placeholder="Nombre *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input type="number" placeholder="Capacidad" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 4 }))} />
            <input type="number" placeholder="Pos X" value={form.position_x} onChange={(e) => setForm((f) => ({ ...f, position_x: parseInt(e.target.value) || 0 }))} />
            <input type="number" placeholder="Pos Y" value={form.position_y} onChange={(e) => setForm((f) => ({ ...f, position_y: parseInt(e.target.value) || 0 }))} />
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
            <input type="number" placeholder="Pos X" value={form.position_x} onChange={(e) => setForm((f) => ({ ...f, position_x: parseInt(e.target.value) || 0 }))} />
            <input type="number" placeholder="Pos Y" value={form.position_y} onChange={(e) => setForm((f) => ({ ...f, position_y: parseInt(e.target.value) || 0 }))} />
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleUpdate} disabled={!form.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
