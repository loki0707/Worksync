import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('ws_user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // On mount, validate stored token
  useEffect(() => {
    const token = localStorage.getItem('ws_token');
    if (!token) { setLoading(false); return; }

    authApi.getMe()
      .then(({ data }) => {
        setUser(data.user);
        connectSocket(token);
      })
      .catch(() => {
        localStorage.removeItem('ws_token');
        localStorage.removeItem('ws_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('ws_token', data.token);
    localStorage.setItem('ws_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authApi.register({ name, email, password });
    localStorage.setItem('ws_token', data.token);
    localStorage.setItem('ws_user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ws_token');
    localStorage.removeItem('ws_user');
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('ws_user', JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
