import { useState, useEffect, useRef } from 'react';
import { apiFetch, api } from '../api/client';
import './Settings.css';

interface LogoResponse {
  url: string | null;
}

export default function Settings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLogo = () => {
    apiFetch<LogoResponse>('/settings/logo')
      .then(({ url }) => setLogoUrl(url))
      .catch(() => setLogoUrl(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogo();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.upload<{ url: string }>('/settings/logo', formData);
      setLogoUrl('/api/settings/logo/image');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar el logo?')) return;
    setError('');
    try {
      await api.delete('/settings/logo');
      setLogoUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const imgSrc = logoUrl?.startsWith('http') ? logoUrl : logoUrl || null;

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>Configuración</h1>
      </div>
      <div className="card settings-card">
        <h2>Logo de la cafetería</h2>
        <p className="settings-desc">El logo se muestra en el menú lateral y en la pantalla de login.</p>
        {loading && <p>Cargando...</p>}
        {!loading && (
          <>
            {logoUrl && (
              <div className="logo-preview">
                <img src={imgSrc || logoUrl} alt="Logo actual" className="logo-preview-img" />
              </div>
            )}
            <div className="logo-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                onChange={handleUpload}
                disabled={uploading}
                className="file-input hidden"
              />
              <button type="button" className="btn primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {logoUrl && (
                <button className="btn btn-danger" onClick={handleDelete} disabled={uploading}>
                  Eliminar logo
                </button>
              )}
            </div>
            <p className="settings-hint">Formatos: PNG, JPG, SVG, WebP. Máximo 2 MB.</p>
          </>
        )}
        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
}
