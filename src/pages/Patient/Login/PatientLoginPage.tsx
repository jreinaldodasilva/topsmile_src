import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import './PatientLoginPage.css';

const PatientLoginPage: React.FC = () => {
  const { login, loading, error, clearError, isAuthenticated } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/patient/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component mounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        console.log('Patient login successful');
      }
    } catch (err: any) {
      console.error('Patient login error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (error) {
      clearError();
    }
  };

  return (
    <div className="patient-login-page">
      <div className="patient-login-container">
        {/* Header */}
        <div className="patient-login-header">
          <div className="patient-login-logo">
            <svg className="patient-login-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="patient-login-title">
            Portal do Paciente
          </h1>
          <p className="patient-login-subtitle">
            Acesse sua conta para gerenciar seus agendamentos e informações
          </p>
        </div>

        {/* Success message from registration */}
        {(location.state as any)?.message && (
          <div className="patient-login-success">
            <div className="success-icon">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="success-message">
              {(location.state as any).message}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="patient-login-form" onSubmit={handleSubmit}>
          {/* Error Banner */}
          {error && (
            <div className="patient-login-error">
              <div className="error-icon">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="error-content">
                <h3 className="error-title">
                  Erro no login
                </h3>
                <div className="error-message">
                  {error}
                </div>
              </div>
            </div>
          )}

          <div className="form-fields">
            {/* Email Field */}
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pr-10"
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="patient-login-button"
            >
              <span className="button-icon">
                {loading ? (
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          {/* Additional Links */}
          <div className="patient-login-links">
            <Link
              to="/patient/forgot-password"
              className="forgot-password-link"
            >
              Esqueceu a senha?
            </Link>
            <Link
              to="/patient/register"
              className="register-link"
            >
              Criar conta
            </Link>
          </div>

          {/* Back to Home */}
          <div className="back-to-home">
            <Link
              to="/"
              className="back-link"
            >
              ← Voltar ao site
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientLoginPage;
