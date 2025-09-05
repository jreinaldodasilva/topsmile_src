// src/App.tsx - Updated with Enhanced Error Handling
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { NotificationContainer } from './components/Notifications';
import ProtectedRoute from './components/Auth/ProtectedRoute/ProtectedRoute';
import CalendarPage from "./pages/Calendar/CalendarPage";
import FormRendererPage from "./pages/FormRenderer/FormRendererPage";
import UnauthorizedPage from "./pages/Unauthorized/UnauthorizedPage";
import './styles/global.css';

// Simple Loading component
const Loading: React.FC = () => (
  <div role="status" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <span style={{ fontSize: '1.2rem' }}>Loading...</span>
  </div>
);

// Public pages
const Home = React.lazy(() => import('./pages/Home/Home'));
const FeaturesPage = React.lazy(() => import('./pages/Features/FeaturesPage'));
const PricingPage = React.lazy(() => import('./pages/Pricing/PricingPage'));
const ContactPage = React.lazy(() => import('./pages/Contact/ContactPage'));
const LoginPage = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Login/RegisterPage'));

// Admin pages
const AdminPage = React.lazy(() => import('./pages/Login/AdminPage'));
const ContactManagement = React.lazy(() => import('./pages/Admin/ContactManagement'));
const PatientManagement = React.lazy(() => import('./pages/Admin/PatientManagement'));
const ProviderManagement = React.lazy(() => import('./pages/Admin/ProviderManagement'));
const AppointmentCalendar = React.lazy(() => import('./pages/Admin/AppointmentCalendar'));

const App: React.FC = () => (
  <ErrorBoundary level="critical" context="app-root">
    <ErrorProvider>
      <Router>
        <AuthProvider>
          <ErrorBoundary level="page" context="router">
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/" 
                  element={
                    <ErrorBoundary level="page" context="home-page">
                      <Home />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/features" 
                  element={
                    <ErrorBoundary level="page" context="features-page">
                      <FeaturesPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/pricing" 
                  element={
                    <ErrorBoundary level="page" context="pricing-page">
                      <PricingPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/contact" 
                  element={
                    <ErrorBoundary level="page" context="contact-page">
                      <ContactPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/login" 
                  element={
                    <ErrorBoundary level="page" context="login-page">
                      <LoginPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <ErrorBoundary level="page" context="register-page">
                      <RegisterPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/calendar" 
                  element={
                    <ErrorBoundary level="page" context="calendar-page">
                      <CalendarPage />
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/forms" 
                  element={
                    <ErrorBoundary level="page" context="forms-page">
                      <FormRendererPage templateId="default" />
                    </ErrorBoundary>
                  } 
                />

                {/* Protected admin routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={['super_admin', 'admin', 'manager']}>
                      <ErrorBoundary level="page" context="admin-dashboard">
                        <AdminPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/contacts"
                  element={
                    <ProtectedRoute roles={['super_admin', 'admin', 'manager']}>
                      <ErrorBoundary level="page" context="contact-management">
                        <ContactManagement />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Enhanced admin routes */}
                <Route
                  path="/admin/patients"
                  element={
                    <ProtectedRoute roles={['super_admin', 'admin', 'manager', 'dentist']}>
                      <ErrorBoundary level="page" context="patient-management">
                        <PatientManagement />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/providers"
                  element={
                    <ProtectedRoute roles={['super_admin', 'admin', 'manager']}>
                      <ErrorBoundary level="page" context="provider-management">
                        <ProviderManagement />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/appointments"
                  element={
                    <ProtectedRoute roles={['super_admin', 'admin', 'manager', 'dentist', 'assistant']}>
                      <ErrorBoundary level="page" context="appointment-management">
                        <AppointmentCalendar />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/billing"
                  element={
                    <ProtectedRoute roles={['super_admin', 'admin', 'manager']}>
                      <ErrorBoundary level="page" context="billing-management">
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                          <h1>Financeiro</h1>
                          <p>Em desenvolvimento...</p>
                          <button onClick={() => window.location.href = '/admin'}>
                            ← Voltar ao Dashboard
                          </button>
                        </div>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />

                {/* Redirect unknown routes */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          
          {/* Global notification container */}
          <NotificationContainer />
        </AuthProvider>
      </Router>
    </ErrorProvider>
  </ErrorBoundary>
);

export default App;