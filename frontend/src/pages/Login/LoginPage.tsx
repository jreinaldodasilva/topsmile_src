import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/Auth/LoginForm/LoginForm';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/admin" replace />;

  return (
    <div className="login-page">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
