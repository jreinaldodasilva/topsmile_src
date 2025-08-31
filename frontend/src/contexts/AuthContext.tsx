// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../services/http';
import type { User } from '../types/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;        // original internal loading
  isLoading: boolean;      // alias used across components
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'topsmile_access_token';
const REFRESH_TOKEN_KEY = 'topsmile_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user if token present
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!token) {
          if (mounted) setLoading(false);
          return;
        }

        const profile = await request('/api/auth/me', { method: 'GET' }, true);
        if (mounted) {
          setUser(profile.data ?? null);
        }
      } catch (err) {
        // If we can't load user, clear tokens
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }, false);
      const accessToken = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken;
      if (!accessToken || !refreshToken) throw new Error(res.message || 'No tokens returned');
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

      // fetch profile
      const profile = await request('/api/auth/me', { method: 'GET' }, true);
      setUser(profile.data ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao autenticar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao cadastrar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await request('/api/auth/me', { method: 'GET' }, true);
      setUser(profile.data ?? null);
    } catch (err) {
      setUser(null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    error,
    clearError,
    login,
    register,
    logout,
    refreshUser
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
