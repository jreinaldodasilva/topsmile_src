import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import { apiService } from '../../../services/apiService';
import PatientNavigation from '../../../components/PatientNavigation';
import './PatientAppointments.css';

interface Appointment {
  _id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  appointmentType: {
    name: string;
  };
  provider: {
    name: string;
  };
  clinic: {
    name: string;
  };
  notes?: string;
}

const PatientAppointmentsList: React.FC = function PatientAppointmentsList() {
  const { patientUser, isAuthenticated } = usePatientAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.appointments.getAll({
        patient: patientUser?.patient._id,
        sort: '-scheduledStart'
      });

      if (response.success && response.data) {
        setAppointments(response.data as Appointment[]);
      } else {
        setError('Erro ao carregar agendamentos');
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [patientUser?.patient._id]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/patient/login');
      return;
    }

    fetchAppointments();
  }, [isAuthenticated, navigate, fetchAppointments]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
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
        return 'Confirmado';
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'no_show':
        return 'Faltou';
      default:
        return status;
    }
  };

  const isUpcoming = (appointment: Appointment) => {
    return new Date(appointment.scheduledStart) > new Date();
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'upcoming') return isUpcoming(appointment);
    if (filter === 'past') return !isUpcoming(appointment);
    return true;
  });

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }

    try {
      const response = await apiService.appointments.update(appointmentId, {
        status: 'cancelled'
      });

      if (response.success) {
        fetchAppointments(); // Refresh the list
      } else {
        alert('Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Erro ao cancelar agendamento');
    }
  };

  if (!patientUser) {
    return (
      <div className="patient-appointments">
        <div className="appointments-loading">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-appointments">
      <PatientNavigation activePage="appointments" />

      <div className="appointments-content">
        {/* Header */}
        <header className="appointments-header">
          <div className="header-content">
            <h1 className="page-title">Meus Agendamentos</h1>
            <button
              className="new-appointment-btn"
              onClick={() => navigate('/patient/appointments/new')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Agendamento
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos ({appointments.length})
            </button>
            <button
              className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Próximos ({appointments.filter(isUpcoming).length})
            </button>
            <button
              className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
              onClick={() => setFilter('past')}
            >
              Passados ({appointments.filter(a => !isUpcoming(a)).length})
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <main className="appointments-main">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Carregando agendamentos...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button
                onClick={fetchAppointments}
                className="retry-button"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3>Nenhum agendamento encontrado</h3>
              <p>
                {filter === 'upcoming'
                  ? 'Você não tem agendamentos próximos.'
                  : filter === 'past'
                  ? 'Você não tem agendamentos passados.'
                  : 'Você ainda não tem agendamentos.'
                }
              </p>
              <button
                onClick={() => navigate('/patient/appointments/new')}
                className="schedule-button"
              >
                Agendar Consulta
              </button>
            </div>
          ) : (
            <div className="appointments-list">
              {filteredAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.scheduledStart);
                const upcoming = isUpcoming(appointment);

                return (
                  <div key={appointment._id} className="appointment-card">
                    <div className="appointment-info">
                      <div className="appointment-primary">
                        <h3>{appointment.appointmentType.name}</h3>
                        <p className="appointment-provider">
                          Dr. {appointment.provider.name}
                        </p>
                        <p className="appointment-clinic">
                          {appointment.clinic.name}
                        </p>
                      </div>
                      <div className="appointment-secondary">
                        <div className="appointment-datetime">
                          <span className="appointment-date">{date}</span>
                          <span className="appointment-time">{time}</span>
                        </div>
                        <span
                          className="appointment-status"
                          style={{ backgroundColor: getStatusColor(appointment.status) }}
                        >
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => navigate(`/patient/appointments/${appointment._id}`)}
                      >
                        Ver Detalhes
                      </button>
                      {upcoming && appointment.status !== 'cancelled' && (
                        <button
                          className="action-btn cancel-btn"
                          onClick={() => handleCancelAppointment(appointment._id)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientAppointmentsList;
