import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/settings/logo`)
      .then((r) => r.json())
      .then((d: { url: string | null }) => setLogoUrl(d.url))
      .catch(() => setLogoUrl(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          {(() => {
            const logoSrc = logoUrl || import.meta.env.VITE_LOGO_URL
            const imgSrc = logoSrc
              ? logoSrc.startsWith('http')
                ? logoSrc
                : API_BASE.startsWith('http')
                  ? new URL(logoSrc.startsWith('/') ? logoSrc : '/' + logoSrc, new URL(API_BASE).origin).href
                  : (logoSrc.startsWith('/') ? logoSrc : '/' + logoSrc)
              : ''
            return imgSrc ? (
              <img src={imgSrc} alt="Logo Cafetería" className="login-logo" />
            ) : null
          })()}
          {!(logoUrl || import.meta.env.VITE_LOGO_URL) && <h1>Cafetería CLEO</h1>}
          <p>Sistema de Gestión</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Ingresar</button>
        </form>
      </div>
    </div>
  );
}
