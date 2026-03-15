import { useState, useRef } from 'react';
import api from '../api/client';
import { useLogo, useLogoImageSrc } from '../contexts/LogoContext';
import { APP_NAME } from '../config';
import './Settings.css';

export default function Settings() {
  const { logoUrl, refreshLogo } = useLogo();
  const logoImgSrc = useLogoImageSrc();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.upload<{ url: string }>('/settings/logo', formData);
      refreshLogo();
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
      refreshLogo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>Configuración</h1>
      </div>
      <div className="card settings-card">
        <h2>Datos del negocio</h2>
        <p className="settings-desc">Nombre que aparece en la aplicación y facturación.</p>
        <div className="settings-business-info">
          <p><strong>Nombre actual:</strong> {APP_NAME}</p>
          <p className="settings-hint">Para cambiarlo, edita <code>VITE_APP_NAME</code> en <code>frontend/.env</code> y reinicia el servidor.</p>
        </div>
      </div>
      <div className="card settings-card">
        <h2>Logo de la cafetería</h2>
        <p className="settings-desc">El logo se muestra en el menú lateral, login y punto de venta.</p>
        {logoImgSrc && (
          <div className="logo-preview">
            <img src={logoImgSrc} alt="Logo actual" className="logo-preview-img" />
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
        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
}
