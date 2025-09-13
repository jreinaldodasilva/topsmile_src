import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PatientAuthProvider, usePatientAuth } from '../../contexts/PatientAuthContext';
import { BrowserRouter } from 'react-router-dom';
import { apiService } from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService', () => ({
  apiService: {
    patientAuth: {
      login: jest.fn(),
      register: jest.fn(),
      me: jest.fn(),
      logout: jest.fn(),
    }
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock navigate removed to fix unused variable
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom')
}));

describe('PatientAuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  const TestComponent = () => {
    const { 
      login,
      logout,
      isAuthenticated,
      loading,
      error,
      patientUser,
      clearError,
      refreshPatientData
    } = usePatientAuth();

    return (
      <div>
        <div data-testid="auth-status">
          {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </div>
        <div data-testid="loading-status">
          {loading ? 'Loading' : 'Not Loading'}
        </div>
        <div data-testid="error-message">
          {error || 'No Error'}
        </div>
        <div data-testid="user-info">
          {patientUser ? `Patient: ${patientUser.patient.name}` : 'No User'}
        </div>
        <button onClick={() => login('patient@example.com', 'password')}>
          Login
        </button>
        <button onClick={() => logout()}>
          Logout
        </button>
        <button onClick={clearError}>
          Clear Error
        </button>
        <button onClick={refreshPatientData}>
          Refresh Patient Data
        </button>
      </div>
    );
  };

  const setup = () => {
    render(
      <BrowserRouter>
        <PatientAuthProvider>
          <TestComponent />
        </PatientAuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial State', () => {
    it('provides authentication context to children', () => {
      setup();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading'); // Initially loading
      expect(screen.getByTestId('error-message')).toHaveTextContent('No Error');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    });
  });

  describe('Login Functionality', () => {
    it('handles successful login', async () => {
      const mockPatientUser = {
        _id: 'user123',
        patient: { name: 'Test Patient' },
        email: 'patient@example.com',
      };

      (apiService.patientAuth.login as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          patientUser: mockPatientUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      });

      setup();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });

      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Patient: Test Patient');
      });
      expect(localStorageMock.getItem('topsmile_patient_access_token')).toBe('access-token');
      expect(localStorageMock.getItem('topsmile_patient_refresh_token')).toBe('refresh-token');
    });

    it('handles login failure', async () => {
      (apiService.patientAuth.login as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Invalid credentials'
      });

      setup();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });

      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
      });
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
    });
  });

  describe('Logout Functionality', () => {
    it('handles logout successfully', async () => {
      // First login
      const mockPatientUser = {
        _id: 'user123',
        patient: { name: 'Test Patient' },
        email: 'patient@example.com',
      };

      (apiService.patientAuth.login as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          patientUser: mockPatientUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      });

      setup();

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading');
      });

      const loginButton = screen.getByRole('button', { name: /Login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      // Now logout
      const logoutButton = screen.getByRole('button', { name: /Logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
      });
      expect(localStorageMock.getItem('topsmile_patient_access_token')).toBeNull();
      expect(localStorageMock.getItem('topsmile_patient_refresh_token')).toBeNull();
    });
  });

  describe('Initial Authentication Check', () => {
    it('verifies existing tokens on mount', async () => {
      localStorageMock.setItem('topsmile_patient_access_token', 'existing-token');
      const mockPatientUser = {
        _id: 'user123',
        patient: { name: 'Existing Patient' },
        email: 'existing@example.com',
      };

      (apiService.patientAuth.me as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { patientUser: mockPatientUser }
      });

      setup();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });
      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('Patient: Existing Patient');
      });
    });

    it('handles invalid tokens on mount', async () => {
      localStorageMock.setItem('topsmile_patient_access_token', 'invalid-token');

      (apiService.patientAuth.me as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Invalid token'
      });

      setup();

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      });
      expect(localStorageMock.getItem('topsmile_patient_access_token')).toBeNull();
    });
  });

  describe('Context Hook', () => {
    it('throws error when used outside provider', () => {
      const TestHook = () => {
        usePatientAuth();
        return <div>Test</div>;
      };

      expect(() => render(<TestHook />)).toThrow('usePatientAuth must be used within a PatientAuthProvider');
    });
  });
});