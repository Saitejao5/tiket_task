import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as auth from '../services/auth';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  useEffect(() => { if (!localStorage.getItem('token')) return; auth.me().then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false)); }, []);
  const start = ({ token, user }) => { localStorage.setItem('token', token); setUser(user); return user; };
  const login = useCallback(async (b) => start(await auth.login(b)), []);
  const register = useCallback(async (b) => start(await auth.register(b)), []);
  const logout = useCallback(async () => { localStorage.removeItem('token'); setUser(null); await auth.logout(); }, []);
  const refresh = useCallback(async () => setUser(await auth.me()), []);
  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}
