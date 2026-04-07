import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    api('/api/auth/refresh').then((d) => { setAccessToken(d.accessToken); setUser(d.user); }).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    accessToken,
    user,
    async register(payload) {
      return api('/api/auth/register', { method: 'POST', body: payload });
    },
    async login(payload) {
      const data = await api('/api/auth/login', { method: 'POST', body: payload });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data;
    },
    async logout() {
      await api('/api/auth/logout', { method: 'POST' });
      setAccessToken('');
      setUser(null);
    },
    async refreshProfile() {
      if (!accessToken) return null;
      const data = await api('/api/users/me', { token: accessToken });
      setUser(data.user);
      return data;
    }
  }), [accessToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
