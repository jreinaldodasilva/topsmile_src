import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../services/http';

const ACCESS_KEY = 'topsmile_access_token';
const REFRESH_KEY = 'topsmile_refresh_token';

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean; // Expose loading state
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const [logoutReason, setLogoutReason] = useState<string | null>(null);

  const isAuthenticated = !loading && !!accessToken;

  // Verify token on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem(ACCESS_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      // Assuming a lightweight endpoint to validate the token
      try {
        const res = await request('/api/auth/me', { method: 'GET' });
        if (res.ok) {
          setAccessToken(token);
        } else {
          // This will trigger the refresh flow in http.ts, if it also fails,
          // the storage event or a thrown error will handle the logout.
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
        }
      } catch (err) {
        // If the refresh logic itself fails, tokens are cleared by http.ts
        console.error('Initial auth check failed', err);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        auth: false, // Explicitly unauthenticated
      });

      if (res.ok && res.data) {
        localStorage.setItem(ACCESS_KEY, res.data.accessToken);
        localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
        setAccessToken(res.data.accessToken);
        setLogoutReason(null);
        navigate('/dashboard');
        return { success: true };
      } else {
        return { success: false, message: res.message || 'An unknown error occurred' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const logout = (reason?: string) => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    if (reason) {
      setLogoutReason(reason);
    }
    navigate('/login');
  };

  // Sync auth state across tabs
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_KEY && e.newValue === null) {
        logout('Your session has expired. Please log in again.');
      }
    };
    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, []);

  // Show reason for logout after redirect
  useEffect(() => {
    if (logoutReason) {
      alert(logoutReason);
      setLogoutReason(null);
    }
  }, [logoutReason]);

  const value = { isAuthenticated, accessToken, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};