import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/Login/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('LoginPage', () => {
  const setup = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders login form', () => {
    setup();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('allows user to type email and password', () => {
    setup();
    const emailInput = screen.getByLabelText(/E-mail/i);
    const passwordInput = screen.getByLabelText(/Senha/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('toggles password visibility', () => {
    setup();
    const passwordInput = screen.getByLabelText(/Senha/i);
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

    // Initially password type is password
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);

    // After click, type should be text
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);

    // After second click, type should be password again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows error message on login failure', async () => {
    setup();

    // Mock login to fail
    const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockReturnValue({
      login: loginMock,
      loading: false,
      error: 'Invalid credentials',
      clearError: jest.fn(),
      isAuthenticated: false
    });

    const submitButton = screen.getByRole('button', { name: /Entrar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Erro no login/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
