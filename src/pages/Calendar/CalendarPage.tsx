// src/pages/Calendar/CalendarPage.tsx
import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import type { Appointment, Patient, Provider, AppointmentType } from '../../types/api';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    let mounted = true;
    
    if (!isAuthenticated) {
      setAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get appointments for the current month
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        const queryParams = {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        
        const result = await apiService.appointments.getAll(queryParams);
        
        if (!mounted) return;
        
        if (result.success && result.data) {
          setAppointments(result.data);
        } else {
          setError(result.message || 'Erro ao carregar agendamentos');
          setAppointments([]);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos');
        setAppointments([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, selectedDate]);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduledStart);
      return appointmentDate.toDateString() === date.toDateString();
    });
  };

  // Get appointment type color
  const getAppointmentColor = (appointment: Appointment) => {
    const appointmentType = appointment.appointmentType as AppointmentType;
    return appointmentType?.color || '#3b82f6';
  };

  // Format time
  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="calendar-page">
        <div className="container">
          <div className="text-center">
            <h1 className="calendar-title">Agenda</h1>
            <p className="calendar-subtitle">Faça login para visualizar sua agenda.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="calendar-page">
        <div className="container">
          <div className="text-center">
            <h1 className="calendar-title">Agenda</h1>
            <p className="calendar-subtitle">Carregando agendamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="container">
        <div className="calendar-header">
          <h1 className="calendar-title">Agenda</h1>
          <p className="calendar-subtitle">Visualize seus agendamentos no calendário</p>
        </div>

        {error && (
          <div className="calendar-error">
            <div className="error-content">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="error-text">{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="error-retry"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="calendar-grid">
          {/* Calendar */}
          <div className="calendar-main">
            <div className="calendar-card">
              <Calendar
                value={selectedDate}
                onChange={(date) => setSelectedDate(date as Date)}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (activeStartDate) {
                    setSelectedDate(activeStartDate);
                  }
                }}
                tileContent={({ date }) => {
                  const dayAppointments = getAppointmentsForDate(date);
                  
                  if (dayAppointments.length === 0) return null;
                  
                  return (
                    <div className="mt-1">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {dayAppointments.slice(0, 3).map((appointment, index) => (
                          <div
                            key={appointment._id}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getAppointmentColor(appointment) }}
                            title={`${formatTime(appointment.scheduledStart)} - ${(appointment.patient as Patient).fullName}`}
                          />
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayAppointments.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
                className="w-full"
                locale="pt-BR"
              />
            </div>
          </div>

          {/* Appointments for selected date */}
          <div className="calendar-sidebar">
            <div className="calendar-card">
              <h2 className="calendar-card-title">
                Agendamentos - {selectedDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              
              {loading && (
                <div className="text-center py-4">
                  <span className="text-gray-500">Carregando...</span>
                </div>
              )}
              
              {!loading && (
                <div className="space-y-3">
                  {getAppointmentsForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">Nenhum agendamento para este dia</p>
                    </div>
                  ) : (
                    getAppointmentsForDate(selectedDate)
                      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
                      .map(appointment => (
                        <div key={appointment._id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: getAppointmentColor(appointment) }}
                                />
                                <span className="font-medium text-sm">
                                  {formatTime(appointment.scheduledStart)} - {formatTime(appointment.scheduledEnd)}
                                </span>
                              </div>
                              
                              <h3 className="font-medium text-gray-900">
                                {(appointment.patient as Patient).fullName}
                              </h3>
                              
                              <p className="text-sm text-gray-600">
                                {(appointment.appointmentType as AppointmentType)?.name || 'Consulta'}
                              </p>
                              
                              <p className="text-sm text-gray-500">
                                {(appointment.provider as Provider).name}
                              </p>
                              
                              {appointment.notes && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                            
                            <div className="ml-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.status === 'scheduled' ? 'Agendado' :
                                 appointment.status === 'confirmed' ? 'Confirmado' :
                                 appointment.status === 'completed' ? 'Concluído' :
                                 appointment.status === 'cancelled' ? 'Cancelado' :
                                 appointment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Upcoming appointments summary */}
            {appointments.length > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Agendamentos</h3>
                <div className="space-y-2">
                  {appointments
                    .filter(apt => new Date(apt.scheduledStart) >= new Date())
                    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
                    .slice(0, 5)
                    .map(appointment => (
                      <div key={appointment._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-sm">
                            {(appointment.patient as Patient).fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(appointment.scheduledStart).toLocaleDateString('pt-BR')} às {formatTime(appointment.scheduledStart)}
                          </p>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getAppointmentColor(appointment) }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;