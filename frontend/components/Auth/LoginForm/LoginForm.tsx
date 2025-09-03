// frontend/src/components/Auth/LoginForm/LoginForm.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import './LoginForm.css';

const LoginForm: React.FC = () => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
    } catch {
      // error state is handled by context
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-header">
          <h1>TopSmile Admin</h1>
          <p>Faça login para acessar o painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
              placeholder="seu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                placeholder="Sua senha"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p>Primeira vez no TopSmile?</p>
          <a href="/register" className="register-link">
            Criar conta
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
