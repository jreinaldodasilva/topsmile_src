// src/pages/Admin/AppointmentCalendar.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import type { Appointment, Provider, Patient } from '../../types/api';
import AppointmentForm from '../../components/Admin/Forms/AppointmentForm';
import './AppointmentCalendar.css';

interface CalendarFilters {
  providerId?: string;
  status?: string;
  date?: string;
  view: 'day' | 'week' | 'month';
}

const AppointmentCalendar: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    view: 'week',
    date: new Date().toISOString().split('T')[0]
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch appointments and providers
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters for appointments
      const appointmentParams: Record<string, any> = {};
      
      if (filters.providerId) {
        appointmentParams.providerId = filters.providerId;
      }
      
      if (filters.status) {
        appointmentParams.status = filters.status;
      }
      
      // Add date range based on current view and date
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      switch (filters.view) {
        case 'day':
          // Same day
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'week':
          // Week range
          startDate.setDate(currentDate.getDate() - currentDate.getDay());
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'month':
          // Month range
          startDate.setDate(1);
          endDate.setMonth(startDate.getMonth() + 1);
          endDate.setDate(0);
          break;
      }
      
      appointmentParams.start = startDate.toISOString();
      appointmentParams.end = endDate.toISOString();

      // Fetch appointments and providers in parallel
      const [appointmentsResult, providersResult] = await Promise.all([
        apiService.appointments.getAll(appointmentParams),
        apiService.providers.getAll({ isActive: true })
      ]);
      
      if (appointmentsResult.success && appointmentsResult.data) {
        setAppointments(appointmentsResult.data);
      } else {
        setError(appointmentsResult.message || 'Erro ao carregar agendamentos');
        setAppointments([]);
      }
      
      if (providersResult.success && providersResult.data) {
        setProviders(providersResult.data);
      } else {
        // Don't set error for providers, just use empty array
        setProviders([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (key: keyof CalendarFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDateTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'scheduled': 'Agendado',
      'confirmed': 'Confirmado',
      'checked_in': 'Check-in',
      'in_progress': 'Em andamento',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'no_show': 'Faltou'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': '#6b7280',
      'confirmed': '#3b82f6',
      'checked_in': '#f59e0b',
      'in_progress': '#10b981',
      'completed': '#059669',
      'cancelled': '#dc2626',
      'no_show': '#991b1b'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'routine': 'Rotina',
      'urgent': 'Urgente',
      'emergency': 'Emergência'
    };
    return labels[priority] || priority;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (filters.view) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
    setFilters(prev => ({ ...prev, date: newDate.toISOString().split('T')[0] }));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setFilters(prev => ({ ...prev, date: today.toISOString().split('T')[0] }));
  };

  const getDateRangeLabel = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };

    switch (filters.view) {
      case 'day':
        return currentDate.toLocaleDateString('pt-BR', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', options)}`;
      case 'month':
        return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      default:
        return '';
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="appointment-calendar">
        <div className="loading-container">
          <div className="loading-spinner">Carregando agendamentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-calendar">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-content">
          <h1>Agenda de Consultas</h1>
          <p>Gerencie os agendamentos da sua clínica</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewAppointmentModal(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nova Consulta
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="date-navigation">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => navigateDate('prev')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="date-range">
            <h2>{getDateRangeLabel()}</h2>
          </div>
          
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => navigateDate('next')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            className="btn btn-outline btn-sm"
            onClick={goToToday}
          >
            Hoje
          </button>
        </div>

        <div className="view-controls">
          <div className="view-buttons">
            {(['day', 'week', 'month'] as const).map(view => (
              <button
                key={view}
                className={`btn btn-sm ${filters.view === view ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleFilterChange('view', view)}
              >
                {view === 'day' ? 'Dia' : view === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Profissional:</label>
            <select
              value={filters.providerId || ''}
              onChange={(e) => handleFilterChange('providerId', e.target.value || undefined)}
              className="filter-select"
            >
              <option value="">Todos</option>
              {providers.map(provider => (
                <option key={provider._id} value={provider._id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="filter-select"
            >
              <option value="">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="checked_in">Check-in</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="no_show">Faltou</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchData} className="retry-button">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Appointments List */}
      <div className="appointments-container">
        <div className="appointments-header">
          <h3>Consultas ({appointments.length})</h3>
          {loading && <span className="loading-indicator">Atualizando...</span>}
        </div>

        <div className="appointments-list">
          {appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-content">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3>Nenhuma consulta encontrada</h3>
                <p>Não há consultas agendadas para o período selecionado</p>
              </div>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div 
                key={appointment._id} 
                className="appointment-card"
                onClick={() => setSelectedAppointment(appointment)}
              >
                <div className="appointment-time">
                  <div className="time-range">
                    {formatTime(appointment.scheduledStart)} - {formatTime(appointment.scheduledEnd)}
                  </div>
                  <div className="appointment-date">
                    {new Date(appointment.scheduledStart).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="appointment-info">
                  <div className="patient-info">
                    <h4>{(appointment.patient as Patient).fullName}</h4>
                    <p>{(appointment.patient as Patient).phone}</p>
                  </div>
                  
                  <div className="appointment-details">
                    <div className="appointment-type">
                      <span 
                        className="type-indicator"
                        style={{ backgroundColor: (appointment.appointmentType as any)?.color || '#6b7280' }}
                      ></span>
                      {(appointment.appointmentType as any)?.name || 'Consulta'}
                    </div>
                    
                    <div className="provider-name">
                      {(appointment.provider as Provider).name}
                    </div>
                  </div>
                </div>

                <div className="appointment-status">
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: getStatusColor(appointment.status),
                      color: 'white'
                    }}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                  
                  {appointment.priority !== 'routine' && (
                    <span className={`priority-badge ${appointment.priority}`}>
                      {getPriorityLabel(appointment.priority || 'routine')}
                    </span>
                  )}
                </div>

                <div className="appointment-actions">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAppointment(appointment);
                    }}
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes da Consulta</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedAppointment(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="appointment-details-modal">
                <div className="detail-section">
                  <h3>Informações da Consulta</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Tipo:</label>
                      <span>{(selectedAppointment.appointmentType as any)?.name || 'Consulta'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Data/Hora Agendada:</label>
                      <span>
                        {formatDateTime(selectedAppointment.scheduledStart)} - {formatTime(selectedAppointment.scheduledEnd)}
                      </span>
                    </div>
                    {selectedAppointment.actualStart && (
                      <div className="detail-item">
                        <label>Data/Hora Real:</label>
                        <span>
                          {formatDateTime(selectedAppointment.actualStart)} - {selectedAppointment.actualEnd ? formatTime(selectedAppointment.actualEnd) : 'Em andamento'}
                        </span>
                      </div>
                    )}
                    <div className="detail-item">
                      <label>Status:</label>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(selectedAppointment.status),
                          color: 'white'
                        }}
                      >
                        {getStatusLabel(selectedAppointment.status)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Prioridade:</label>
                      <span className={`priority-badge ${selectedAppointment.priority}`}>
                        {getPriorityLabel(selectedAppointment.priority || 'routine')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Paciente</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Nome:</label>
                      <span>{(selectedAppointment.patient as Patient).fullName}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{(selectedAppointment.patient as Patient).email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Telefone:</label>
                      <span>{(selectedAppointment.patient as Patient).phone}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Profissional</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Nome:</label>
                      <span>{(selectedAppointment.provider as Provider).name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{(selectedAppointment.provider as Provider).email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Especialidades:</label>
                      <span>{(selectedAppointment.provider as Provider).specialties?.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="detail-section">
                    <h3>Observações</h3>
                    <p className="notes-text">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setSelectedAppointment(null)}
              >
                Fechar
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {/* TODO: Edit appointment */}}
              >
                Editar Consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Appointment Modal */}
      {(showNewAppointmentModal || editingAppointment) && (
        <div className="modal-overlay" onClick={() => {
          setShowNewAppointmentModal(false);
          setEditingAppointment(null);
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAppointment ? 'Editar Consulta' : 'Nova Consulta'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowNewAppointmentModal(false);
                  setEditingAppointment(null);
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <AppointmentForm
                appointment={editingAppointment}
                onSave={(appointment) => {
                  // Update the appointments list
                  if (editingAppointment) {
                    setAppointments(prev => prev.map(a => a._id === appointment._id ? appointment : a));
                  } else {
                    setAppointments(prev => [appointment, ...prev]);
                  }
                  
                  // Close modal
                  setShowNewAppointmentModal(false);
                  setEditingAppointment(null);
                }}
                onCancel={() => {
                  setShowNewAppointmentModal(false);
                  setEditingAppointment(null);
                }}
                preselectedDate={currentDate.toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;