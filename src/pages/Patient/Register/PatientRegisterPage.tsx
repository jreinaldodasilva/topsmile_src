import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import './PatientRegisterPage.css';

const PatientRegisterPage: React.FC = () => {
  const { register, loading, error, clearError } = usePatientAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Clear errors when component mounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    try {
      const result = await register({
        patientId: formData.patientId,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        navigate('/patient/login', {
          state: { message: 'Conta criada! Verifique seu e-mail para ativar a conta.' }
        });
      }
    } catch (err: any) {
      console.error('Patient registration error:', err);
    }
  };

  return (
    <div className="patient-register-page">
      <div className="patient-register-container">
        <h1>Registrar Conta de Paciente</h1>
        <form className="patient-register-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <label htmlFor="patientId">ID do Paciente</label>
          <input
            id="patientId"
            name="patientId"
            type="text"
            required
            value={formData.patientId}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="Digite seu ID de paciente"
          />

          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="seu@email.com"
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="Sua senha"
          />

          <label htmlFor="confirmPassword">Confirmar Senha</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={loading}
            placeholder="Confirme sua senha"
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <p>
          Já tem uma conta? <Link to="/patient/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default PatientRegisterPage;
