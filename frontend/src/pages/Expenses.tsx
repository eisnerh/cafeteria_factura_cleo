import { useState, useEffect } from 'react';
import api, { apiFetch } from '../api/client';
import './Expenses.css';

const PAYMENT_TYPES = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'sinpe', label: 'Sinpe' },
  { value: 'tarjeta_credito', label: 'Tarjeta de crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta de débito' },
] as const;

interface Expense {
  id: number;
  amount: number;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  payment_type?: string;
}

interface Supplier {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'expense' | 'category' | 'supplier' | null>(null);
  const [editMode, setEditMode] = useState<'category' | 'supplier' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'expense' | 'category' | 'supplier'; id: number } | null>(null);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category_id: '' as string | number, supplier_id: '' as string | number, payment_type: 'efectivo' as string });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', phone: '', email: '' });
  const [currentCashRegisterId, setCurrentCashRegisterId] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ open: boolean; session: { id: number } | null }>('/cash-register/current')
      .then(r => setCurrentCashRegisterId(r.data?.open && r.data?.session ? r.data.session.id : null))
      .catch(() => setCurrentCashRegisterId(null));
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch<Expense[]>('/expenses'),
      apiFetch<Supplier[]>('/expenses/suppliers'),
      apiFetch<Category[]>('/expenses/categories'),
    ])
      .then(([e, s, c]) => {
        setExpenses(e);
        setSuppliers(s);
        setCategories(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadAll = () => {
    Promise.all([
      apiFetch<Expense[]>('/expenses'),
      apiFetch<Supplier[]>('/expenses/suppliers'),
      apiFetch<Category[]>('/expenses/categories'),
    ]).then(([e, s, c]) => {
      setExpenses(e);
      setSuppliers(s);
      setCategories(c);
    }).catch(console.error);
  };

  const handleCreateExpense = async () => {
    await api.post('/expenses', {
      amount: parseFloat(expenseForm.amount) || 0,
      description: expenseForm.description || undefined,
      category_id: expenseForm.category_id ? Number(expenseForm.category_id) : undefined,
      supplier_id: expenseForm.supplier_id ? Number(expenseForm.supplier_id) : undefined,
      cash_register_id: currentCashRegisterId ?? undefined,
      payment_type: expenseForm.payment_type || 'efectivo',
    });
    setModal(null);
    setExpenseForm({ amount: '', description: '', category_id: '', supplier_id: '', payment_type: 'efectivo' });
    loadAll();
  };

  const handleCreateCategory = async () => {
    await api.post('/expenses/categories', { name: categoryForm.name });
    setModal(null);
    setCategoryForm({ name: '' });
    loadAll();
  };

  const handleUpdateCategory = async () => {
    if (editId) {
      await api.patch(`/expenses/categories/${editId}`, { name: categoryForm.name });
      setModal(null);
      setEditMode(null);
      setEditId(null);
      setCategoryForm({ name: '' });
      loadAll();
    }
  };

  const handleCreateSupplier = async () => {
    await api.post('/expenses/suppliers', supplierForm);
    setModal(null);
    setSupplierForm({ name: '', contact: '', phone: '', email: '' });
    loadAll();
  };

  const handleUpdateSupplier = async () => {
    if (editId) {
      await api.patch(`/expenses/suppliers/${editId}`, supplierForm);
      setModal(null);
      setEditMode(null);
      setEditId(null);
      setSupplierForm({ name: '', contact: '', phone: '', email: '' });
      loadAll();
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    if (type === 'expense') await api.delete(`/expenses/${id}`);
    if (type === 'category') await api.delete(`/expenses/categories/${id}`);
    if (type === 'supplier') await api.delete(`/expenses/suppliers/${id}`);
    setDeleteConfirm(null);
    loadAll();
  };

  const openEditCategory = (c: Category) => {
    setEditMode('category');
    setEditId(c.id);
    setCategoryForm({ name: c.name });
    setModal('category');
  };

  const openEditSupplier = (s: Supplier) => {
    setEditMode('supplier');
    setEditId(s.id);
    setSupplierForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '' });
    setModal('supplier');
  };

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openEditExpense = (ex: Expense) => {
    setEditingExpense(ex);
    setExpenseForm({
      amount: String(ex.amount ?? ''),
      description: ex.description || '',
      category_id: ex.category_id ?? '',
      supplier_id: ex.supplier_id ?? '',
      payment_type: ex.payment_type || 'efectivo',
    });
    setModal('expense');
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    await api.patch(`/expenses/${editingExpense.id}`, {
      amount: parseFloat(expenseForm.amount) || 0,
      description: expenseForm.description || undefined,
      category_id: expenseForm.category_id ? Number(expenseForm.category_id) : undefined,
      supplier_id: expenseForm.supplier_id ? Number(expenseForm.supplier_id) : undefined,
      payment_type: expenseForm.payment_type || 'efectivo',
    });
    setModal(null);
    setEditingExpense(null);
    setExpenseForm({ amount: '', description: '', category_id: '', supplier_id: '', payment_type: 'efectivo' });
    loadAll();
  };

  if (loading) return <div className="page"><p>Cargando...</p></div>;

  return (
    <div className="page expenses-page">
      <div className="page-header">
        <h1>Gastos</h1>
        <div className="header-actions">
          <button className="btn primary" onClick={() => { setModal('expense'); setExpenseForm({ amount: '', description: '', category_id: '', supplier_id: '', payment_type: 'efectivo' }); api.get<{ open: boolean; session: { id: number } | null }>('/cash-register/current').then(r => setCurrentCashRegisterId(r.data?.open && r.data?.session ? r.data.session.id : null)).catch(() => setCurrentCashRegisterId(null)); }}>+ Nuevo gasto</button>
          <button className="btn" onClick={() => { setModal('category'); setEditMode(null); setCategoryForm({ name: '' }); }}>+ Categoría</button>
          <button className="btn" onClick={() => { setModal('supplier'); setEditMode(null); setSupplierForm({ name: '', contact: '', phone: '', email: '' }); }}>+ Proveedor</button>
        </div>
      </div>

      <div className="expenses-layout">
        <div className="card">
          <h3>Gastos recientes</h3>
          <table className="data-table">
            <thead>
              <tr><th>Monto</th><th>Descripción</th><th>Categoría</th><th>Proveedor</th><th>Pago</th><th></th></tr>
            </thead>
            <tbody>
              {expenses.map((ex) => (
                <tr key={ex.id}>
                  <td>₡{Number(ex.amount).toLocaleString()}</td>
                  <td>{ex.description || '-'}</td>
                  <td>{categories.find((c) => c.id === ex.category_id)?.name || '-'}</td>
                  <td>{suppliers.find((s) => s.id === ex.supplier_id)?.name || '-'}</td>
                  <td>{PAYMENT_TYPES.find(p => p.value === ex.payment_type)?.label || ex.payment_type || '-'}</td>
                  <td>
                    <button className="btn-sm" onClick={() => openEditExpense(ex)}>Editar</button>
                    <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm({ type: 'expense', id: ex.id })}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Categorías</h3>
          <ul className="crud-list">
            {categories.map((c) => (
              <li key={c.id}>
                {c.name}
                <span>
                  <button className="btn-sm" onClick={() => openEditCategory(c)}>Editar</button>
                  <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm({ type: 'category', id: c.id })}>Eliminar</button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Proveedores</h3>
          <ul className="crud-list">
            {suppliers.map((s) => (
              <li key={s.id}>
                {s.name}
                <span>
                  <button className="btn-sm" onClick={() => openEditSupplier(s)}>Editar</button>
                  <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm({ type: 'supplier', id: s.id })}>Eliminar</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p>¿Eliminar este registro?</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'expense' && (
        <div className="modal-overlay" onClick={() => { setModal(null); setEditingExpense(null); setExpenseForm({ amount: '', description: '', category_id: '', supplier_id: '', payment_type: 'efectivo' }); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingExpense ? 'Editar gasto' : 'Nuevo gasto'}</h2>
            {!editingExpense && (
              <p className="expense-caja-hint">
                {currentCashRegisterId ? '✓ Se descontará de la caja abierta' : '⚠ No hay caja abierta. El gasto no se descontará.'}
              </p>
            )}
            <input type="number" step="0.01" placeholder="Monto *" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} />
            <input placeholder="Descripción" value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} />
            <label>Tipo de pago</label>
            <select value={expenseForm.payment_type} onChange={(e) => setExpenseForm((f) => ({ ...f, payment_type: e.target.value }))}>
              {PAYMENT_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select value={expenseForm.category_id} onChange={(e) => setExpenseForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={expenseForm.supplier_id} onChange={(e) => setExpenseForm((f) => ({ ...f, supplier_id: e.target.value }))}>
              <option value="">Sin proveedor</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="modal-actions">
              <button onClick={() => { setModal(null); setEditingExpense(null); setExpenseForm({ amount: '', description: '', category_id: '', supplier_id: '', payment_type: 'efectivo' }); }}>Cancelar</button>
              {editingExpense ? (
                <button className="btn primary" onClick={handleUpdateExpense} disabled={!expenseForm.amount}>Guardar</button>
              ) : (
                <button className="btn primary" onClick={handleCreateExpense} disabled={!expenseForm.amount}>Crear</button>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === 'category' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editMode === 'category' ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <input placeholder="Nombre *" value={categoryForm.name} onChange={(e) => setCategoryForm({ name: e.target.value })} />
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button
                className="btn primary"
                onClick={editMode === 'category' ? handleUpdateCategory : handleCreateCategory}
                disabled={!categoryForm.name}
              >
                {editMode === 'category' ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'supplier' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editMode === 'supplier' ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <input placeholder="Nombre *" value={supplierForm.name} onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))} />
            <input placeholder="Contacto" value={supplierForm.contact} onChange={(e) => setSupplierForm((f) => ({ ...f, contact: e.target.value }))} />
            <input placeholder="Teléfono" value={supplierForm.phone} onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))} />
            <input type="email" placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))} />
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button
                className="btn primary"
                onClick={editMode === 'supplier' ? handleUpdateSupplier : handleCreateSupplier}
                disabled={!supplierForm.name}
              >
                {editMode === 'supplier' ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
