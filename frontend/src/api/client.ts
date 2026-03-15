/**
 * Cliente API para Cafetería CLEO.
 * Base URL configurable para apuntar al backend FastAPI.
 */
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('cafeteria_token');
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('cafeteria_token');
    localStorage.removeItem('cafeteria_user');
    window.location.href = '/login';
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = Array.isArray(err.detail) ? err.detail.join(', ') : (err.detail || 'Error de red');
    throw new Error(typeof msg === 'string' ? msg : 'Error de red');
  }
  return res.json() as Promise<T>;
}

/** Wrapper estilo axios para compatibilidad con componentes. */
const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint).then(data => ({ data })),
  post: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data })),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data })),
  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }).then(data => ({ data })),
  /** Sube un archivo (FormData). No incluye Content-Type para que el navegador añada boundary. */
  upload: <T>(endpoint: string, formData: FormData) => {
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE}${endpoint}`, { method: 'POST', body: formData, headers })
      .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json() as Promise<T>; })
      .then(data => ({ data }));
  },
};
export default api;
