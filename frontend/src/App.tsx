// src/App.tsx - Updated with Contact Management Routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/Auth/ProtectedRoute/ProtectedRoute';

// Public pages
import Home from './pages/Home/Home';
import FeaturesPage from './pages/Features/FeaturesPage';
import PricingPage from './pages/Pricing/PricingPage';
import ContactPage from './pages/Contact/ContactPage';
import LoginPage from './pages/Login/LoginPage';

import CalendarPage from "./pages/Calendar/CalendarPage";
import FormRendererPage from "./pages/FormRenderer/FormRendererPage";

// Admin pages
import AdminPage from './pages/Login/AdminPage';
import ContactManagement from './pages/Admin/ContactManagement';

import './styles/global.css';

const App: React.FC = () => (
  <ErrorBoundary>
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/forms" element={<FormRendererPage templateId="default" />} />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['super_admin', 'admin', 'manager']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/contacts"
            element={
              <ProtectedRoute roles={['super_admin', 'admin', 'manager']}>
                <ContactManagement />
              </ProtectedRoute>
            }
          />

          {/* Future admin routes can be added here */}
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute roles={['super_admin', 'admin', 'manager', 'dentist']}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h1>Gestão de Pacientes</h1>
                  <p>Em desenvolvimento...</p>
                  <button onClick={() => window.location.href = '/admin'}>
                    ← Voltar ao Dashboard
                  </button>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute roles={['super_admin', 'admin', 'manager', 'dentist', 'assistant']}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h1>Agendamentos</h1>
                  <p>Em desenvolvimento...</p>
                  <button onClick={() => window.location.href = '/admin'}>
                    ← Voltar ao Dashboard
                  </button>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute roles={['super_admin', 'admin', 'manager']}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h1>Financeiro</h1>
                  <p>Em desenvolvimento...</p>
                  <button onClick={() => window.location.href = '/admin'}>
                    ← Voltar ao Dashboard
                  </button>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;