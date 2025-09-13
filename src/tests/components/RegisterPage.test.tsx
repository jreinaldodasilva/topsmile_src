import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from '../../pages/Login/RegisterPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';

describe('RegisterPage', () => {
  const setup = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders registration form fields', () => {
    setup();
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar/i })).toBeInTheDocument();
  });

  it('allows user to type in form fields', () => {
    setup();
    const nameInput = screen.getByLabelText(/Nome/i);
    const emailInput = screen.getByLabelText(/E-mail/i);
    const passwordInput = screen.getByLabelText(/Senha/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirmar Senha/i);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });
});
