import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
  has_image?: boolean;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'product' | 'category' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productForm, setProductForm] = useState(productFormInit);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'product' | 'category'; id: number } | null>(null);
  const [showLowStock, setShowLowStock] = useState(searchParams.get('lowStock') === '1');
  const [productImageKey, setProductImageKey] = useState(0);
  const [categoryImageKey, setCategoryImageKey] = useState(0);
  const productFileRef = useRef<HTMLInputElement>(null);
  const categoryFileRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (searchParams.get('lowStock') === '1' && !showLowStock) setShowLowStock(true);
  }, [searchParams]);

  const goToLowStock = () => {
    setShowLowStock(true);
    setSearchParams({ lowStock: '1' }, { replace: true });
  };

  const displayProducts = showLowStock
    ? products.filter(p => p.min_stock != null && p.stock <= p.min_stock)
    : products;

  const handleCreateProduct = async () => {
    const { data } = await api.post<Product>('/inventory/products', {
      ...productForm,
      description: productForm.description || null,
      barcode: productForm.barcode || null,
    });
    load();
    // Mantener modal abierto para que pueda agregar imagen al nuevo producto
    setEditingProduct(data);
    setProductForm({
      name: data.name,
      description: data.description || '',
      price: Number(data.price),
      cost: Number(data.cost || 0),
      stock: Number(data.stock),
      min_stock: Number(data.min_stock || 0),
      barcode: data.barcode || '',
      category_id: data.category_id ?? undefined,
      is_active: data.is_active,
    });
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    await api.patch(`/inventory/products/${editingProduct.id}`, {
      name: productForm.name,
      description: productForm.description || null,
      price: productForm.price,
      cost: productForm.cost,
      stock: productForm.stock,
      barcode: productForm.barcode || null,
      min_stock: Number(productForm.min_stock ?? 0),
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

  const productImgUrl = (id: number) => `${API_BASE}/inventory/products/${id}/image?t=${productImageKey}`;
  const categoryImgUrl = (id: number) => `${API_BASE}/inventory/categories/${id}/image?t=${categoryImageKey}`;

  const [imageError, setImageError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadingCardId, setUploadingCardId] = useState<number | null>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const pendingCardProductIdRef = useRef<number | null>(null);

  const triggerCardImageUpload = (productId: number) => {
    pendingCardProductIdRef.current = productId;
    setUploadingCardId(productId);
    cardFileRef.current?.click();
  };

  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const productId = pendingCardProductIdRef.current;
    pendingCardProductIdRef.current = null;
    if (!file || !productId) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.upload(`/inventory/products/${productId}/image`, fd);
      setProductImageKey(k => k + 1);
    } catch {
      alert('Error al subir imagen');
    } finally {
      setUploadingCardId(null);
      if (cardFileRef.current) cardFileRef.current.value = '';
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.upload(`/inventory/products/${productId}/image`, fd);
      setProductImageKey(k => k + 1);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setImageUploading(false);
      if (productFileRef.current) productFileRef.current.value = '';
    }
  };

  const handleProductImageDelete = async (productId: number) => {
    if (!confirm('¿Eliminar imagen?')) return;
    await api.delete(`/inventory/products/${productId}/image`);
    setProductImageKey(k => k + 1);
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.upload(`/inventory/categories/${categoryId}/image`, fd);
    setCategoryImageKey(k => k + 1);
    if (categoryFileRef.current) categoryFileRef.current.value = '';
  };

  const handleCategoryImageDelete = async (categoryId: number) => {
    if (!confirm('¿Eliminar imagen?')) return;
    await api.delete(`/inventory/categories/${categoryId}/image`);
    setCategoryImageKey(k => k + 1);
  };

  return (
    <div className="page inventory-page">
      <input ref={cardFileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg" className="hidden" onChange={handleCardImageUpload} />
      <div className="page-header">
            <h1>Inventario</h1>
        <div className="page-actions">
          <label>
            <input type="checkbox" checked={showLowStock} onChange={e => { setShowLowStock(e.target.checked); setSearchParams(e.target.checked ? { lowStock: '1' } : {}, { replace: true }); }} />
            Solo stock bajo
          </label>
          {showLowStock && lowStockCount > 0 && (
            <Link to="/pos" className="btn primary">
              Hacer pedido →
            </Link>
          )}
          <button className="btn primary" onClick={() => { setEditingProduct(null); setProductForm(productFormInit); setModal('product'); }}>
            + Producto
          </button>
          <button className="btn" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '' }); setModal('category'); }}>
            + Categoría
          </button>
        </div>
      </div>
      {lowStockCount > 0 && (
        <div className="alert-low-stock-row">
          <div
            className={`alert alert-warning ${!showLowStock ? 'alert-clickable' : ''}`}
            onClick={() => !showLowStock && goToLowStock()}
            role={!showLowStock ? 'button' : undefined}
            tabIndex={!showLowStock ? 0 : undefined}
            onKeyDown={e => !showLowStock && (e.key === 'Enter' || e.key === ' ') && goToLowStock()}
          >
            ⚠️ {lowStockCount} producto(s) con stock bajo
            {!showLowStock && <span className="alert-hint"> — Clic para filtrar</span>}
          </div>
          {showLowStock && (
            <Link to="/pos" className="btn primary btn-pos-link">
              Hacer pedido →
            </Link>
          )}
        </div>
      )}
      <input ref={cardFileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg" className="hidden" onChange={handleCardImageUpload} />
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="inventory-layout">
          <section>
            <h2>Productos</h2>
            <div className="card-grid">
              {displayProducts.map((p) => (
                <div key={p.id} className={`card ${p.min_stock != null && p.stock <= p.min_stock ? 'low-stock' : ''}`}>
                  <div className="product-card-image" onClick={() => triggerCardImageUpload(p.id)} title="Agregar o cambiar imagen">
                    {p.has_image ? (
                      <img src={productImgUrl(p.id)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.add('visible'); }} />
                    ) : null}
                    <span className={`product-card-image-placeholder${!p.has_image ? ' visible' : ''}`}>{uploadingCardId === p.id ? 'Subiendo...' : '+'}</span>
                  </div>
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
        <div className="modal-overlay" onClick={() => setModal(null)} key={editingProduct?.id ?? 'new'}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
            <input placeholder="Nombre *" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} required />
            <input placeholder="Descripción" value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} />
            <input type="number" placeholder="Precio" value={productForm.price || ''} onChange={e => setProductForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            <input type="number" placeholder="Costo" value={productForm.cost || ''} onChange={e => setProductForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} />
            <input type="number" placeholder="Stock inicial" value={productForm.stock || ''} onChange={e => setProductForm(f => ({ ...f, stock: parseFloat(e.target.value) || 0 }))} />
            <input type="number" placeholder="Stock mínimo" min={0} step={1} value={productForm.min_stock ?? ''} onChange={e => setProductForm(f => ({ ...f, min_stock: Math.max(0, Number(e.target.value) || 0) }))} />
            <input placeholder="Código de barras" value={productForm.barcode} onChange={e => setProductForm(f => ({ ...f, barcode: e.target.value }))} />
            <select value={productForm.category_id ?? ''} onChange={e => setProductForm(f => ({ ...f, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}>
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {editingProduct && (
              <label><input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.checked }))} /> Activo</label>
            )}
            {editingProduct && (
              <div className="form-image-section">
                <label>Imagen del producto</label>
                <div className="image-preview-row">
                  <img src={productImgUrl(editingProduct.id)} alt="" className="entity-preview-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="image-actions">
                    <input ref={productFileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg" className="file-input hidden" onChange={(e) => handleProductImageUpload(e, editingProduct.id)} />
                    <button type="button" className="btn-sm" onClick={() => { setImageError(null); productFileRef.current?.click(); }} disabled={imageUploading}>
                      {imageUploading ? 'Subiendo...' : 'Subir/Cambiar'}
                    </button>
                    <button type="button" className="btn-sm btn-danger" onClick={() => handleProductImageDelete(editingProduct.id)} disabled={imageUploading}>Eliminar imagen</button>
                  </div>
                </div>
                {imageError && <p className="form-image-error">{imageError}</p>}
              </div>
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
            {editingCategory && (
              <div className="form-image-section">
                <label>Imagen de la categoría</label>
                <div className="image-preview-row">
                  <img src={categoryImgUrl(editingCategory.id)} alt="" className="entity-preview-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <div className="image-actions">
                    <input ref={categoryFileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg" className="file-input hidden" onChange={(e) => handleCategoryImageUpload(e, editingCategory.id)} />
                    <button type="button" className="btn-sm" onClick={() => categoryFileRef.current?.click()}>Subir/Cambiar</button>
                    <button type="button" className="btn-sm btn-danger" onClick={() => handleCategoryImageDelete(editingCategory.id)}>Eliminar imagen</button>
                  </div>
                </div>
              </div>
            )}
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
