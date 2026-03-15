import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'
import './Clients.css'

interface Client {
  id: number
  name: string
  phone?: string
  email?: string
  requiere_nit?: boolean
  nit?: string
  nombre_legal?: string
  direccion?: string
}

const emptyForm = { name: '', phone: '', email: '', requiere_nit: false, nit: '', nombre_legal: '', direccion: '' }

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    apiFetch<Client[]>(`/clients?search=${encodeURIComponent(search)}`).then(setClients).catch(console.error).finally(() => setLoading(false))
  }, [search])

  const loadClients = () => apiFetch<Client[]>('/clients').then(setClients).catch(console.error)

  const handleCreate = async () => {
    await apiFetch('/clients', { method: 'POST', body: JSON.stringify({ ...form, nit: form.requiere_nit ? form.nit : null, nombre_legal: form.requiere_nit ? form.nombre_legal : null, direccion: form.requiere_nit ? form.direccion : null }) })
    setModal(null)
    setForm(emptyForm)
    loadClients()
  }

  const handleEdit = (c: Client) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      requiere_nit: c.requiere_nit || false,
      nit: c.nit || '',
      nombre_legal: c.nombre_legal || '',
      direccion: c.direccion || '',
    })
    setModal('edit')
  }

  const handleUpdate = async () => {
    if (!editingId) return
    await apiFetch(`/clients/${editingId}`, { method: 'PATCH', body: JSON.stringify({ ...form, nit: form.requiere_nit ? form.nit : null, nombre_legal: form.requiere_nit ? form.nombre_legal : null, direccion: form.requiere_nit ? form.direccion : null }) })
    setModal(null)
    setEditingId(null)
    setForm(emptyForm)
    loadClients()
  }

  const handleDelete = async (id: number) => {
    await apiFetch(`/clients/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadClients()
  }

  return (
    <div className="page clients-page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button className="btn primary" onClick={() => { setForm(emptyForm); setModal('create'); }}>+ Nuevo cliente</button>
      </div>
      <input type="search" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
      {loading ? <p>Cargando...</p> : (
        <div className="cards-grid">
          {clients.map(c => (
            <div key={c.id} className="card">
              <div className="card-header">
                <h3>{c.name}</h3>
                <div className="card-actions">
                  <button className="btn-sm" onClick={() => handleEdit(c)}>Editar</button>
                  <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm(c.id)}>Eliminar</button>
                </div>
              </div>
              {c.phone && <p>Tel: {c.phone}</p>}
              {c.email && <p>{c.email}</p>}
              {c.requiere_nit && c.nit && <p className="nit">NIT: {c.nit}</p>}
              {deleteConfirm === c.id && (
                <div className="confirm-box">
                  <span>¿Eliminar?</span>
                  <button className="btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Sí</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nuevo cliente</h2>
            <input placeholder="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input placeholder="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <input type="email" placeholder="Correo" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <label><input type="checkbox" checked={form.requiere_nit} onChange={e => setForm(f => ({ ...f, requiere_nit: e.target.checked }))} /> Factura con NIT</label>
            {form.requiere_nit && (
              <>
                <input placeholder="NIT" value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} />
                <input placeholder="Nombre legal" value={form.nombre_legal} onChange={e => setForm(f => ({ ...f, nombre_legal: e.target.value }))} />
                <input placeholder="Dirección" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
              </>
            )}
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleCreate} disabled={!form.name}>Crear</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'edit' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Editar cliente</h2>
            <input placeholder="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input placeholder="Teléfono" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <input type="email" placeholder="Correo" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <label><input type="checkbox" checked={form.requiere_nit} onChange={e => setForm(f => ({ ...f, requiere_nit: e.target.checked }))} /> Factura con NIT</label>
            {form.requiere_nit && (
              <>
                <input placeholder="NIT" value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} />
                <input placeholder="Nombre legal" value={form.nombre_legal} onChange={e => setForm(f => ({ ...f, nombre_legal: e.target.value }))} />
                <input placeholder="Dirección" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
              </>
            )}
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={handleUpdate} disabled={!form.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
