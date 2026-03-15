import { useState, useEffect } from 'react';
import api from '../api/client';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  min_stock?: number;
  barcode?: string;
  category_id?: number;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
}

const productFormInit = {
  name: '',
  description: '',
  price: 0,
  cost: 0,
  stock: 0,
  min_stock: 0,
  barcode: '',
  category_id: undefined as number | undefined,
  is_active: true,
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'product' | 'category' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productForm, setProductForm] = useState(productFormInit);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'product' | 'category'; id: number } | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Product[]>('/inventory/products'),
      api.get<Category[]>('/inventory/categories'),
    ])
      .then(([p, c]) => {
        setProducts(p.data);
        setCategories(c.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const displayProducts = showLowStock
    ? products.filter(p => p.min_stock != null && p.stock <= p.min_stock)
    : products;

  const handleCreateProduct = async () => {
    await api.post('/inventory/products', {
      ...productForm,
      description: productForm.description || null,
      barcode: productForm.barcode || null,
    });
    setModal(null);
    setProductForm(productFormInit);
    load();
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    await api.patch(`/inventory/products/${editingProduct.id}`, {
      name: productForm.name,
      description: productForm.description || null,
      price: productForm.price,
      cost: productForm.cost,
      barcode: productForm.barcode || null,
      min_stock: productForm.min_stock,
      category_id: productForm.category_id || null,
      is_active: productForm.is_active,
    });
    setModal(null);
    setEditingProduct(null);
    setProductForm(productFormInit);
    load();
  };

  const handleDeleteProduct = async (id: number) => {
    await api.delete(`/inventory/products/${id}`);
    setDeleteConfirm(null);
    load();
  };

  const handleCreateCategory = async () => {
    await api.post('/inventory/categories', { name: categoryForm.name });
    setModal(null);
    setCategoryForm({ name: '' });
    load();
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    await api.patch(`/inventory/categories/${editingCategory.id}`, { name: categoryForm.name });
    setModal(null);
    setEditingCategory(null);
    setCategoryForm({ name: '' });
    load();
  };

  const handleDeleteCategory = async (id: number) => {
    await api.delete(`/inventory/categories/${id}`);
    setDeleteConfirm(null);
    load();
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: Number(p.price),
      cost: Number(p.cost || 0),
      stock: Number(p.stock),
      min_stock: Number(p.min_stock || 0),
      barcode: p.barcode || '',
      category_id: p.category_id ?? undefined,
      is_active: p.is_active,
    });
    setModal('product');
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryForm({ name: c.name });
    setModal('category');
  };

  const lowStockCount = products.filter(p => p.min_stock != null && p.stock <= p.min_stock).length;

  return (
    <div className="page inventory-page">
      <div className="page-header">
        <h1>Inventario</h1>
        <div className="page-actions">
          <label>
            <input type="checkbox" checked={showLowStock} onChange={e => setShowLowStock(e.target.checked)} />
            Solo stock bajo
          </label>
          <button className="btn primary" onClick={() => { setEditingProduct(null); setProductForm(productFormInit); setModal('product'); }}>
            + Producto
          </button>
          <button className="btn" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '' }); setModal('category'); }}>
            + Categoría
          </button>
        </div>
      </div>
      {lowStockCount > 0 && (
        <div className="alert alert-warning">⚠️ {lowStockCount} producto(s) con stock bajo</div>
      )}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="inventory-layout">
          <section>
            <h2>Productos</h2>
            <div className="card-grid">
              {displayProducts.map((p) => (
                <div key={p.id} className={`card ${p.min_stock != null && p.stock <= p.min_stock ? 'low-stock' : ''}`}>
                  <div className="card-header">
                    <h3>{p.name}</h3>
                    <div className="card-actions">
                      <button className="btn-sm" onClick={() => openEditProduct(p)}>Editar</button>
                      <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm({ type: 'product', id: p.id })}>Eliminar</button>
                    </div>
                  </div>
                  <p className="desc">{p.description || '—'}</p>
                  <div className="meta">
                    <span>Precio: ₡{Number(p.price).toLocaleString()}</span>
                    <span>Stock: {p.stock} {p.min_stock != null ? `(mín: ${p.min_stock})` : ''}</span>
                  </div>
                  {deleteConfirm?.type === 'product' && deleteConfirm?.id === p.id && (
                    <div className="confirm-box">
                      <span>¿Desactivar producto?</span>
                      <button className="btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDeleteProduct(p.id)}>Sí</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <aside className="categories-sidebar">
            <h3>Categorías</h3>
            <ul>
              {categories.map((c) => (
                <li key={c.id} className="category-item">
                  <span>{c.name}</span>
                  <div className="card-actions">
                    <button className="btn-sm" onClick={() => openEditCategory(c)}>Editar</button>
                    <button className="btn-sm btn-danger" onClick={() => setDeleteConfirm({ type: 'category', id: c.id })}>×</button>
                  </div>
                </li>
              ))}
            </ul>
            {deleteConfirm?.type === 'category' && deleteConfirm?.id && (
              <div className="confirm-box">
                <span>¿Eliminar categoría?</span>
                <button className="btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                <button className="btn-sm btn-danger" onClick={() => handleDeleteCategory(deleteConfirm.id)}>Sí</button>
              </div>
            )}
          </aside>
        </div>
      )}
      {modal === 'product' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
            <input placeholder="Nombre *" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} required />
            <input placeholder="Descripción" value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} />
            <input type="number" placeholder="Precio" value={productForm.price || ''} onChange={e => setProductForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            <input type="number" placeholder="Costo" value={productForm.cost || ''} onChange={e => setProductForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} />
            <input type="number" placeholder="Stock inicial" value={productForm.stock || ''} onChange={e => setProductForm(f => ({ ...f, stock: parseFloat(e.target.value) || 0 }))} />
            <input type="number" placeholder="Stock mínimo" value={productForm.min_stock || ''} onChange={e => setProductForm(f => ({ ...f, min_stock: parseFloat(e.target.value) || 0 }))} />
            <input placeholder="Código de barras" value={productForm.barcode} onChange={e => setProductForm(f => ({ ...f, barcode: e.target.value }))} />
            <select value={productForm.category_id ?? ''} onChange={e => setProductForm(f => ({ ...f, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}>
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {editingProduct && (
              <label><input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.checked }))} /> Activo</label>
            )}
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={editingProduct ? handleUpdateProduct : handleCreateProduct} disabled={!productForm.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {modal === 'category' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <input placeholder="Nombre *" value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })} required />
            <div className="modal-actions">
              <button onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={editingCategory ? handleUpdateCategory : handleCreateCategory} disabled={!categoryForm.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
