import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/Auth/ProtectedRoute/ProtectedRoute';

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;
const UnauthorizedComponent = () => <div>Unauthorized Page</div>;

const renderProtectedRoute = (contextValue: Partial<AuthContextType>, roles: string[] = [], initialEntries: string[] = ['/protected']) => {
  return render(
    <AuthContext.Provider value={contextValue as AuthContextType}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/unauthorized" element={<UnauthorizedComponent />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute roles={roles}>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute', () => {
  it('shows loading state', () => {
    renderProtectedRoute({ loading: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    renderProtectedRoute({ isAuthenticated: false, loading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children for authenticated users with no role requirement', () => {
    renderProtectedRoute({ isAuthenticated: true, loading: false, user: { role: 'admin', name: 'Test User', email: 'test@test.com' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children for authenticated users with the correct role', () => {
    renderProtectedRoute({
      isAuthenticated: true,
      loading: false,
      user: { role: 'admin', name: 'Test User', email: 'test@test.com' }
    }, ['admin', 'manager']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to unauthorized page for users with incorrect role', () => {
    renderProtectedRoute({
      isAuthenticated: true,
      loading: false,
      user: { role: 'dentist', name: 'Test User', email: 'test@test.com' }
    }, ['admin', 'manager']);
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });
});
