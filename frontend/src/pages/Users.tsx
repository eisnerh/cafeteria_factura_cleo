import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role_id: number;
}
interface Role {
  id: number;
  name: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    password: '',
    is_active: true,
    role_id: 1,
  });

  const loadUsers = () => {
    setLoading(true);
    apiFetch<User[]>('/users')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    apiFetch<Role[]>('/users/roles').catch(() => [])
      .then((r: Role[] | { data?: Role[] }) => {
        const arr = Array.isArray(r) ? r : (r as { data?: Role[] })?.data;
        if (arr?.length) setRoles(arr);
      });
  }, []);

  // Fallback: get roles from seed if no /auth/roles - use hardcoded for now
  const roleList = roles.length ? roles : [
    { id: 1, name: 'administrador' },
    { id: 2, name: 'camarero' },
    { id: 3, name: 'cocina' },
    { id: 4, name: 'cajero' },
  ];

  const handleCreate = async () => {
    await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        is_active: form.is_active,
        role_id: form.role_id,
      }),
    });
    setModal(null);
    setForm({ email: '', full_name: '', password: '', is_active: true, role_id: 1 });
    loadUsers();
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setForm({
      email: u.email,
      full_name: u.full_name,
      password: '',
      is_active: u.is_active,
      role_id: u.role_id,
    });
    setModal('edit');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const body: Record<string, unknown> = {
      full_name: form.full_name,
      is_active: form.is_active,
      role_id: form.role_id,
    };
    if (form.password) body.password = form.password;
    await apiFetch(`/users/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
    setModal(null);
    setEditingId(null);
    loadUsers();
  };

  const roleName = (roleId: number) => roleList.find(r => r.id === roleId)?.name || roleId;

  return (
    <div className="page users-page">
      <div className="page-header">
        <h1>Usuarios</h1>
        <button className="btn primary" onClick={() => { setForm({ email: '', full_name: '', password: '', is_active: true, role_id: 1 }); setModal('create'); }}>
          + Nuevo usuario
        </button>
      </div>
      {loading ? <p>Cargando...</p> : (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.full_name}</td>
                  <td>{roleName(u.role_id)}</td>
                  <td>{u.is_active ? 'Sí' : 'No'}</td>
                  <td>
                    <button className="btn-sm" onClick={() => handleEdit(u)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nuevo usuario</h2>
            <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <input placeholder="Nombre completo *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            <input type="password" placeholder="Contraseña *" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <label>Rol
              <select value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: Number(e.target.value) }))}>
                {roleList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Activo</label>
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleCreate} disabled={!form.email || !form.full_name || !form.password}>Crear</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Editar usuario</h2>
            <input placeholder="Nombre completo *" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            <input type="password" placeholder="Nueva contraseña (dejar vacío para no cambiar)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <label>Rol
              <select value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: Number(e.target.value) }))}>
                {roleList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Activo</label>
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleUpdate} disabled={!form.full_name}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
