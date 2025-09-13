import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePatientAuth } from '../contexts/PatientAuthContext';
import './PatientNavigation.css';

interface PatientNavigationProps {
  activePage?: string;
}

const PatientNavigation: React.FC<PatientNavigationProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientUser, logout } = usePatientAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getActivePage = () => {
    if (activePage) return activePage;

    const path = location.pathname;
    if (path === '/patient/dashboard') return 'dashboard';
    if (path === '/patient/appointments' || path.startsWith('/patient/appointments/')) return 'appointments';
    if (path === '/patient/profile') return 'profile';
    return '';
  };

  const currentActivePage = getActivePage();

  return (
    <nav className="patient-navigation">
      <div className="nav-container">
        {/* Logo/Brand */}
        <div className="nav-brand">
          <h2>TopSmile</h2>
          <span className="nav-subtitle">Portal do Paciente</span>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          <button
            className={`nav-link ${currentActivePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/patient/dashboard')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
            Dashboard
          </button>

          <button
            className={`nav-link ${currentActivePage === 'appointments' ? 'active' : ''}`}
            onClick={() => navigate('/patient/appointments')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Consultas
          </button>

          <button
            className={`nav-link ${currentActivePage === 'profile' ? 'active' : ''}`}
            onClick={() => navigate('/patient/profile')}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Perfil
          </button>
        </div>

        {/* User Info & Logout */}
        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">
              Olá, {patientUser?.patient?.name?.split(' ')[0] || 'Paciente'}
            </span>
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Sair"
          >
            <svg className="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PatientNavigation;
