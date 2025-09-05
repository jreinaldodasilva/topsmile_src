// src/pages/Login/RegisterPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  clinic: {
    name: string;
    phone: string;
    address: {
      street: string;
      number: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
}

const RegisterPage: React.FC = () => {
  const { register, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    clinic: {
      name: '',
      phone: '',
      address: {
        street: '',
        number: '',
        city: '',
        state: '',
        zipCode: ''
      }
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component mounts or unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'E-mail inválido';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha �� obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }

    // Clinic name validation
    if (!formData.clinic.name.trim()) {
      errors.clinicName = 'Nome da clínica é obrigatório';
    }

    // Clinic phone validation
    if (!formData.clinic.phone.trim()) {
      errors.clinicPhone = 'Telefone da clínica é obrigatório';
    }

    // Address validation
    if (!formData.clinic.address.street.trim()) {
      errors.street = 'Endereço é obrigatório';
    }
    if (!formData.clinic.address.city.trim()) {
      errors.city = 'Cidade é obrigatória';
    }
    if (!formData.clinic.address.state.trim()) {
      errors.state = 'Estado é obrigatório';
    }
    if (!formData.clinic.address.zipCode.trim()) {
      errors.zipCode = 'CEP é obrigatório';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        clinic: formData.clinic
      };

      const result = await register(registerData);
      
      if (result.success) {
        // Navigation is handled by the auth context
        console.log('Registration successful');
      }
      // Error handling is managed by auth context state
    } catch (err: any) {
      console.error('Registration error:', err);
      // Error is already set by auth context
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('clinic.')) {
      const clinicField = name.replace('clinic.', '');
      if (clinicField.startsWith('address.')) {
        const addressField = clinicField.replace('address.', '');
        setFormData(prev => ({
          ...prev,
          clinic: {
            ...prev.clinic,
            address: {
              ...prev.clinic.address,
              [addressField]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          clinic: {
            ...prev.clinic,
            [clinicField]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Criar Conta TopSmile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Cadastre sua clínica e comece a usar o TopSmile
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Banner */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro no cadastro
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
              
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo *
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Clinic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informações da Clínica</h3>
              
              {/* Clinic Name */}
              <div>
                <label htmlFor="clinic.name" className="block text-sm font-medium text-gray-700">
                  Nome da Clínica *
                </label>
                <div className="mt-1">
                  <input
                    id="clinic.name"
                    name="clinic.name"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nome da sua clínica"
                    value={formData.clinic.name}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  {validationErrors.clinicName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.clinicName}</p>
                  )}
                </div>
              </div>

              {/* Clinic Phone */}
              <div>
                <label htmlFor="clinic.phone" className="block text-sm font-medium text-gray-700">
                  Telefone da Clínica *
                </label>
                <div className="mt-1">
                  <input
                    id="clinic.phone"
                    name="clinic.phone"
                    type="tel"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="(11) 99999-9999"
                    value={formData.clinic.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  {validationErrors.clinicPhone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.clinicPhone}</p>
                  )}
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clinic.address.street" className="block text-sm font-medium text-gray-700">
                    Endereço *
                  </label>
                  <div className="mt-1">
                    <input
                      id="clinic.address.street"
                      name="clinic.address.street"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Rua, Avenida..."
                      value={formData.clinic.address.street}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    {validationErrors.street && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.street}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="clinic.address.number" className="block text-sm font-medium text-gray-700">
                    Número
                  </label>
                  <div className="mt-1">
                    <input
                      id="clinic.address.number"
                      name="clinic.address.number"
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="123"
                      value={formData.clinic.address.number}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clinic.address.city" className="block text-sm font-medium text-gray-700">
                    Cidade *
                  </label>
                  <div className="mt-1">
                    <input
                      id="clinic.address.city"
                      name="clinic.address.city"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="São Paulo"
                      value={formData.clinic.address.city}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    {validationErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="clinic.address.state" className="block text-sm font-medium text-gray-700">
                    Estado *
                  </label>
                  <div className="mt-1">
                    <input
                      id="clinic.address.state"
                      name="clinic.address.state"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="SP"
                      value={formData.clinic.address.state}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    {validationErrors.state && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="clinic.address.zipCode" className="block text-sm font-medium text-gray-700">
                  CEP *
                </label>
                <div className="mt-1">
                  <input
                    id="clinic.address.zipCode"
                    name="clinic.address.zipCode"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="01234-567"
                    value={formData.clinic.address.zipCode}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  {validationErrors.zipCode && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.zipCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link 
                to="/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Fazer login
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link 
              to="/" 
              className="font-medium text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Voltar ao site
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;