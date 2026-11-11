import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshSession, setAccessToken, setAuthFailureHandler } from '../lib/api';

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const clear = useCallback(() => { setAccessToken(null); setUser(null); qc.clear(); }, [qc]);
  const applySession = useCallback((data) => { setAccessToken(data.accessToken); setUser(data.user); return data.user; }, []);

  // Restore the session from the httpOnly refresh cookie on page load.
  useEffect(() => {
    setAuthFailureHandler(clear);
    refreshSession().then(applySession).catch(() => setUser(null)).finally(() => setBooting(false));
  }, [applySession, clear]);

  const login = useCallback(async (email, password, otp) => {
    const { data } = await api.post('/auth/login', { email, password, ...(otp ? { otp } : {}) });
    if (data.twoFactorRequired) return { twoFactorRequired: true };
    return { user: applySession(data) };
  }, [applySession]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clear();
  }, [clear]);

  const reloadUser = useCallback(async () => { const { data } = await api.get('/auth/me'); setUser(data.user); return data.user; }, []);

  const can = useCallback((module, action = 'view') => Boolean(user?.permissions?.[module]?.includes(action)), [user]);

  const value = useMemo(
    () => ({ user, booting, login, logout, applySession, reloadUser, can, isSuper: user?.role === 'superAdmin' }),
    [user, booting, login, logout, applySession, reloadUser, can],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
