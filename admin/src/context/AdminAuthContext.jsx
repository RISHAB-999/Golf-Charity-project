import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gc_admin_token');
    if (token) fetchMe();
    else setLoading(false);
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      if (data.role !== 'admin') { localStorage.removeItem('gc_admin_token'); setLoading(false); return; }
      setAdmin(data);
    } catch {
      localStorage.removeItem('gc_admin_token');
    } finally { setLoading(false); }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (data.user.role !== 'admin') throw new Error('Not an admin account');
    localStorage.setItem('gc_admin_token', data.token);
    setAdmin(data.user);
    return data.user;
  };

  const logout = () => { localStorage.removeItem('gc_admin_token'); setAdmin(null); };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
