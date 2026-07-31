'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Викликає /api/auth/me, щоб отримати свіжі дані користувача (баланс тощо)
  const refreshUser = useCallback(async (activeToken) => {
    const t = activeToken || (typeof window !== 'undefined' ? window.localStorage.getItem('token') : null);
    if (!t) {
      setUser(null);
      return null;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });

      if (!response.ok) {
        // Токен недійсний/протермінований — виходимо
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        return null;
      }

      const data = await response.json();
      setUser(data.user);
      window.localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch {
      return null;
    }
  }, []);

  // Ініціалізація з localStorage при завантаженні + звірка з сервером
  useEffect(() => {
    const storedToken = window.localStorage.getItem('token');
    const storedUser = window.localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore malformed cache
        }
      }
      refreshUser(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback((newToken, newUser) => {
    window.localStorage.setItem('token', newToken);
    window.localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    const activeToken = window.localStorage.getItem('token');
    if (activeToken) {
      // Best-effort: revoke this device's session so it drops off the
      // Security → Active Sessions / Login History lists. Don't block logout on it.
      fetch('/api/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${activeToken}` },
        body: JSON.stringify({ action: 'revoke_self' }),
      }).catch(() => {});
    }
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo(
    () => ({ token, user, isLoading, isAuthenticated: Boolean(user), login, logout, refreshUser, setUser }),
    [token, user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
