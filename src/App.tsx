// src/App.tsx - Updated with Enhanced Error Handling
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PatientAuthProvider } from './contexts/PatientAuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { NotificationContainer } from './components/Notifications';
import ProtectedRoute from './components/Auth/ProtectedRoute/ProtectedRoute';
import Skeleton from './components/UI/Skeleton/Skeleton';
import CalendarPage from "./pages/Calendar/CalendarPage";
import FormRendererPage from "./pages/FormRenderer/FormRendererPage";
import UnauthorizedPage from "./pages/Unauthorized/UnauthorizedPage";
import './styles/global.css';

// Enhanced Loading component with skeleton
const Loading: React.FC = () => (
  <div role="status" style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '2rem',
    gap: '1.5rem'
  }}>
    {/* Header skeleton */}
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <Skeleton variant="rectangular" height={40} width="80%" style={{ marginBottom: '1rem' }} />
      <Skeleton variant="text" lines={2} />
    </div>

    {/* Content skeleton */}
    <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton variant="rectangular" height={200} />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Skeleton variant="rectangular" height={100} width="60%" />
        <Skeleton variant="rectangular" height={100} width="40%" />
      </div>
    </div>

    {/* Loading text */}
    <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
      Carregando...
    </span>
  </div>
);

// Public pages
const Home = React.lazy(() => import('./pages/Home/Home'));
const FeaturesPage = React.lazy(() => import('./pages/Features/FeaturesPage'));
const PricingPage = React.lazy(() => import('./pages/Pricing/PricingPage'));
const ContactPage = React.lazy(() => import('./pages/Contact/ContactPage'));
const LoginPage = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Login/RegisterPage'));
const TestComponents = React.lazy(() => import('./pages/TestComponents/TestComponents'));

// Admin pages
const AdminPage = React.lazy(() => import('./pages/Login/AdminPage'));
const ContactManagement = React.lazy(() => import('./pages/Admin/ContactManagement'));
const PatientManagement = React.lazy(() => import('./pages/Admin/PatientManagement'));
const ProviderManagement = React.lazy(() => import('./pages/Admin/ProviderManagement'));
const AppointmentCalendar = React.lazy(() => import('./pages/Admin/AppointmentCalendar'));

// Patient pages
const PatientLoginPage = React.lazy(() => import('./pages/Patient/Login/PatientLoginPage'));
const PatientRegisterPage = React.lazy(() => import('./pages/Patient/Register/PatientRegisterPage'));
const PatientDashboard = React.lazy(() => import('./pages/Patient/Dashboard/PatientDashboard'));
const PatientAppointmentsList = React.lazy(() => import('./pages/Patient/Appointment/PatientAppointmentsList'));
const PatientAppointmentBooking = React.lazy(() => import('./pages/Patient/Appointment/PatientAppointmentBooking'));
const PatientAppointmentDetail = React.lazy(() => import('./pages/Patient/Appointment/PatientAppointmentDetail'));
const PatientProfile = React.lazy(() => import('./pages/Patient/Profile/PatientProfile'));

const App: React.FC = () => (
  <ErrorBoundary level="critical" context="app-root">
    <ErrorProvider>
      <Router>
        <AuthProvider>
          <PatientAuthProvider>
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
                  <Route
                    path="/test-components"
                    element={
                      <ErrorBoundary level="page" context="test-components-page">
                        <TestComponents />
                      </ErrorBoundary>
                    }
                  />

                  {/* Patient routes */}
                  <Route
                    path="/patient/login"
                    element={
                      <ErrorBoundary level="page" context="patient-login-page">
                        <PatientLoginPage />
                      </ErrorBoundary>
                    }
                  />

                  <Route
                    path="/patient/register"
                    element={
                      <ErrorBoundary level="page" context="patient-register-page">
                        <PatientRegisterPage />
                      </ErrorBoundary>
                    }
                  />

                  <Route
                    path="/patient/dashboard"
                    element={
                      <ErrorBoundary level="page" context="patient-dashboard">
                        <PatientDashboard />
                      </ErrorBoundary>
                    }
                  />

                  <Route
                    path="/patient/appointments"
                    element={
                      <ErrorBoundary level="page" context="patient-appointments">
                        <PatientAppointmentsList />
                      </ErrorBoundary>
                    }
                  />

                  <Route
                    path="/patient/appointments/new"
                    element={
                      <ErrorBoundary level="page" context="patient-appointment-booking">
                        <PatientAppointmentBooking />
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

                  <Route
                    path="/patient/appointments/:id"
                    element={
                      <ErrorBoundary level="page" context="patient-appointment-detail">
                        <PatientAppointmentDetail />
                      </ErrorBoundary>
                  }
                />

                  <Route
                    path="/patient/profile"
                    element={
                      <ErrorBoundary level="page" context="patient-profile">
                        <PatientProfile />
                      </ErrorBoundary>
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
          </PatientAuthProvider>
        </AuthProvider>
      </Router>
    </ErrorProvider>
  </ErrorBoundary>
);

export default App;

