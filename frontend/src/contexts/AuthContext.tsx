import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../api/client';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role_id: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('cafeteria_token');
    const u = localStorage.getItem('cafeteria_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      setLoading(false);
      return;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    localStorage.setItem('cafeteria_token', res.access_token);
    localStorage.setItem('cafeteria_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('cafeteria_token');
    localStorage.removeItem('cafeteria_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
