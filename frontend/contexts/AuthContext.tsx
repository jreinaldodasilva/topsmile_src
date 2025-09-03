// src/contexts/AuthContext.tsx - Updated for Backend Integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { logout as httpLogout, hasTokens, getRefreshToken } from '../services/http';
import type { User } from '../types/api';

const ACCESS_KEY = 'topsmile_access_token';
const REFRESH_KEY = 'topsmile_refresh_token';

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: (reason?: string) => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  clinic?: {
    name: string;
    phone: string;
    address: {
      street: string;
      number?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutReason, setLogoutReason] = useState<string | null>(null);

  const isAuthenticated = !loading && !!accessToken && !!user;

  // UPDATED: Enhanced initial authentication check
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if tokens exist in localStorage
        if (!hasTokens()) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem(ACCESS_KEY);
        if (!token) {
          setLoading(false);
          return;
        }

        // Verify token with backend and get user data
        const userResponse = await apiService.auth.me();
        
        if (userResponse.success && userResponse.data) {
          setAccessToken(token);
          setUser(userResponse.data);
        } else {
          // Token invalid, clear storage
          await performLogout('Sessão expirada. Faça login novamente.');
        }
      } catch (err) {
        console.error('Initial auth check failed:', err);
        await performLogout('Erro na verificação de autenticação.');
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // UPDATED: Enhanced login function
  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.auth.login(email, password);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens
        localStorage.setItem(ACCESS_KEY, accessToken);
        localStorage.setItem(REFRESH_KEY, refreshToken);
        
        // Update state
        setAccessToken(accessToken);
        setUser(user);
        setLogoutReason(null);
        
        // Navigate to appropriate page based on user role
        const redirectPath = getRedirectPath(user.role);
        navigate(redirectPath);
        
        return { success: true };
      } else {
        const errorMsg = response.message || 'E-mail ou senha inválidos';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro de rede. Tente novamente.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ADDED: Register function
  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.auth.register(data);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens
        localStorage.setItem(ACCESS_KEY, accessToken);
        localStorage.setItem(REFRESH_KEY, refreshToken);
        
        // Update state
        setAccessToken(accessToken);
        setUser(user);
        
        // Navigate to dashboard
        navigate('/admin');
        
        return { success: true, message: 'Conta criada com sucesso!' };
      } else {
        const errorMsg = response.message || 'Erro ao criar conta';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro de rede. Tente novamente.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Enhanced logout with backend notification
  const logout = async (reason?: string) => {
    await performLogout(reason);
  };

  const performLogout = async (reason?: string) => {
    try {
      const refreshToken = getRefreshToken();
      
      // Clear local state first
      setAccessToken(null);
      setUser(null);
      
      // Notify backend and clear tokens
      await httpLogout(refreshToken || undefined);
      
      if (reason) {
        setLogoutReason(reason);
      }
      
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if backend call fails
      navigate('/login');
    }
  };

  // ADDED: Clear error function
  const clearError = () => {
    setError(null);
  };

  // ADDED: Refresh user data function
  const refreshUserData = async () => {
    try {
      if (!accessToken) return;
      
      const response = await apiService.auth.me();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't logout on user data refresh failure
    }
  };

  // UPDATED: Cross-tab sync with proper cleanup
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_KEY && e.newValue === null) {
        // Another tab logged out
        setAccessToken(null);
        setUser(null);
        setLogoutReason('Você foi desconectado em outra aba.');
        navigate('/login');
      }
    };

    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [navigate]);

  // Show logout reason after redirect
  useEffect(() => {
    if (logoutReason && !loading && !isAuthenticated) {
      const timer = setTimeout(() => {
        alert(logoutReason);
        setLogoutReason(null);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [logoutReason, loading, isAuthenticated]);

  // ADDED: Periodic token validation (optional)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await apiService.auth.me();
      } catch (error) {
        console.warn('Token validation failed:', error);
        await performLogout('Sessão expirada.');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value: AuthContextType = { 
    isAuthenticated, 
    accessToken, 
    user,
    loading, 
    error,
    login, 
    register,
    logout,
    clearError,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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

// ADDED: Helper function to determine redirect path based on role
function getRedirectPath(role?: string): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
    case 'manager':
      return '/admin';
    case 'dentist':
      return '/admin/appointments';
    case 'assistant':
      return '/admin/appointments';
    default:
      return '/admin';
  }
}