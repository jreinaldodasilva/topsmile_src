import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

interface PatientUser {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email?: string;
    phone: string;
    birthDate?: string;
    gender?: string;
    address?: {
      street?: string;
      number?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    medicalHistory?: {
      allergies?: string[];
      medications?: string[];
      conditions?: string[];
      notes?: string;
    };
  };
  email: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
}

interface PatientAuthResult {
  success: boolean;
  message?: string;
}

export interface PatientAuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  patientUser: PatientUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<PatientAuthResult>;
  register: (data: { patientId: string; email: string; password: string }) => Promise<PatientAuthResult>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshPatientData: () => Promise<void>;
}

const ACCESS_KEY = 'topsmile_patient_access_token';
const REFRESH_KEY = 'topsmile_patient_refresh_token';

export const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export const PatientAuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [patientUser, setPatientUser] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !loading && !!accessToken && !!patientUser;

  const performLogout = useCallback(async () => {
    try {
      setAccessToken(null);
      setPatientUser(null);

      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);

      await apiService.patientAuth.logout();
      navigate('/patient/login');
    } catch (error) {
      console.error('Patient logout error:', error);
      navigate('/patient/login');
    }
  }, [navigate]);

  // Initial authentication check
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem(ACCESS_KEY);
        if (!token) {
          setLoading(false);
          return;
        }

        const userResponse = await apiService.patientAuth.me();

        if (userResponse.success && userResponse.data?.patientUser) {
          setAccessToken(token);
          setPatientUser(userResponse.data.patientUser);
        } else {
          await performLogout();
        }
      } catch (err) {
        console.error('Patient auth check failed:', err);
        await performLogout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [performLogout]);

  const login = async (email: string, password: string): Promise<PatientAuthResult> => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.patientAuth.login(email, password);

      if (response.success && response.data) {
        const { patientUser, accessToken, refreshToken } = response.data;

        localStorage.setItem(ACCESS_KEY, accessToken);
        localStorage.setItem(REFRESH_KEY, refreshToken);

        setAccessToken(accessToken);
        setPatientUser(patientUser);

        navigate('/patient/dashboard');
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

  const register = async (data: { patientId: string; email: string; password: string }): Promise<PatientAuthResult> => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.patientAuth.register(data);

      if (response.success && response.data) {
        const { patientUser, accessToken, refreshToken } = response.data;

        if (accessToken && refreshToken) {
          localStorage.setItem(ACCESS_KEY, accessToken);
          localStorage.setItem(REFRESH_KEY, refreshToken);
          setAccessToken(accessToken);
          setPatientUser(patientUser);
          navigate('/patient/dashboard');
        } else {
          // Registration successful but email verification required
          navigate('/patient/login', {
            state: { message: 'Conta criada! Verifique seu e-mail para ativar a conta.' }
          });
        }

        return { success: true, message: response.message };
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

  const logout = async () => {
    await performLogout();
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshPatientData = async () => {
    try {
      if (!accessToken) return;

      const response = await apiService.patientAuth.me();
      if (response.success && response.data?.patientUser) {
        setPatientUser(response.data.patientUser);
      }
    } catch (error) {
      console.error('Failed to refresh patient data:', error);
    }
  };

  // Cross-tab sync
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_KEY && e.newValue === null) {
        setAccessToken(null);
        setPatientUser(null);
        navigate('/patient/login');
      }
    };

    window.addEventListener('storage', onStorageChange);
    return () => window.removeEventListener('storage', onStorageChange);
  }, [navigate]);

  const value: PatientAuthContextType = {
    isAuthenticated,
    accessToken,
    patientUser,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshPatientData
  };

  return (
    <PatientAuthContext.Provider value={value}>
      {children}
    </PatientAuthContext.Provider>
  );
};

export const usePatientAuth = (): PatientAuthContextType => {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
};
