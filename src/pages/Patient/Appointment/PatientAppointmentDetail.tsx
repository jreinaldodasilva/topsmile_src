import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import { apiService } from '../../../services/apiService';
import PatientNavigation from '../../../components/PatientNavigation';
import './PatientAppointmentDetail.css';

interface Appointment {
  _id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  appointmentType: {
    name: string;
    description?: string;
    duration: number;
  };
  provider: {
    name: string;
    specialties: string[];
  };
  clinic: {
    name: string;
    address?: {
      street?: string;
      number?: string;
      city?: string;
      state?: string;
    };
  };
  notes?: string;
  createdAt: string;
}

const PatientAppointmentDetail: React.FC = function PatientAppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patientUser, isAuthenticated } = usePatientAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointment = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.appointments.getOne(id);

      if (response.success && response.data) {
        setAppointment(response.data as Appointment);
      } else {
        setError('Consulta não encontrada');
      }
    } catch (err: any) {
      console.error('Error fetching appointment:', err);
      setError('Erro ao carregar consulta');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/patient/login');
      return;
    }

    if (id) {
      fetchAppointment();
    }
  }, [isAuthenticated, navigate, id, fetchAppointment]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'scheduled':
        return '#3b82f6';
      case 'completed':
        return '#6b7280';
      case 'cancelled':
        return '#ef4444';
      case 'no_show':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'scheduled':
        return 'Agendada';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      case 'no_show':
        return 'Faltou';
      default:
        return status;
    }
  };

  const isUpcoming = () => {
    if (!appointment) return false;
    return new Date(appointment.scheduledStart) > new Date();
  };

  const handleCancelAppointment = async () => {
    if (!appointment || !window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
      return;
    }

    try {
      setCancelling(true);
      const response = await apiService.appointments.update(appointment._id, {
        status: 'cancelled'
      });

      if (response.success) {
        setAppointment(prev => prev ? { ...prev, status: 'cancelled' } : null);
      } else {
        alert('Erro ao cancelar consulta');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Erro ao cancelar consulta');
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = () => {
    // Navigate to booking page with current appointment data
    navigate('/patient/appointments/new', {
      state: { rescheduleAppointment: appointment }
    });
  };

  if (!patientUser) {
    return (
      <div className="appointment-detail">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-detail">
      <PatientNavigation activePage="appointments" />

      <div className="detail-content">
        {/* Header */}
        <header className="detail-header">
          <div className="header-content">
            <button
              className="back-btn"
              onClick={() => navigate('/patient/appointments')}
            >
              ← Voltar
            </button>
            <h1 className="page-title">Detalhes da Consulta</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="detail-main">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Carregando consulta...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button
                onClick={fetchAppointment}
                className="retry-button"
              >
                Tentar novamente
              </button>
            </div>
          ) : appointment ? (
            <div className="appointment-detail-card">
              {/* Status Banner */}
              <div
                className="status-banner"
                style={{ backgroundColor: getStatusColor(appointment.status) }}
              >
                <span className="status-text">
                  {getStatusText(appointment.status)}
                </span>
              </div>

              {/* Appointment Info */}
              <div className="detail-sections">
                {/* Basic Info */}
                <section className="detail-section">
                  <h2>Informações da Consulta</h2>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Tipo de Consulta</label>
                      <p>{appointment.appointmentType.name}</p>
                      {appointment.appointmentType.description && (
                        <small>{appointment.appointmentType.description}</small>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Dentista</label>
                      <p>Dr. {appointment.provider.name}</p>
                      {appointment.provider.specialties.length > 0 && (
                        <small>{appointment.provider.specialties.join(', ')}</small>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Clínica</label>
                      <p>{appointment.clinic.name}</p>
                      {appointment.clinic.address && (
                        <small>
                          {appointment.clinic.address.street}, {appointment.clinic.address.number}
                          {appointment.clinic.address.city && ` - ${appointment.clinic.address.city}`}
                        </small>
                      )}
                    </div>

                    <div className="info-item">
                      <label>Duração</label>
                      <p>{appointment.appointmentType.duration} minutos</p>
                    </div>
                  </div>
                </section>

                {/* Date & Time */}
                <section className="detail-section">
                  <h2>Data e Horário</h2>
                  <div className="datetime-display">
                    <div className="datetime-item">
                      <div className="datetime-icon">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="datetime-content">
                        <h3>Data</h3>
                        <p>{formatDateTime(appointment.scheduledStart).date}</p>
                      </div>
                    </div>

                    <div className="datetime-item">
                      <div className="datetime-icon">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="datetime-content">
                        <h3>Horário</h3>
                        <p>{formatDateTime(appointment.scheduledStart).time}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Notes */}
                {appointment.notes && (
                  <section className="detail-section">
                    <h2>Observações</h2>
                    <div className="notes-content">
                      <p>{appointment.notes}</p>
                    </div>
                  </section>
                )}

                {/* Additional Info */}
                <section className="detail-section">
                  <h2>Informações Adicionais</h2>
                  <div className="additional-info">
                    <div className="info-row">
                      <span>Data de Criação:</span>
                      <span>{new Date(appointment.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Action Buttons */}
              {isUpcoming() && appointment.status !== 'cancelled' && (
                <div className="detail-actions">
                  <button
                    className="action-btn secondary"
                    onClick={handleReschedule}
                  >
                    Reagendar
                  </button>
                  <button
                    className="action-btn danger"
                    onClick={handleCancelAppointment}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelando...' : 'Cancelar Consulta'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default PatientAppointmentDetail;
