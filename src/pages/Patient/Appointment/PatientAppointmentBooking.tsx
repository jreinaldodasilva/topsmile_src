import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import { apiService } from '../../../services/apiService';
import PatientNavigation from '../../../components/PatientNavigation';
import './PatientAppointmentBooking.css';

interface Provider {
  _id: string;
  name: string;
  specialties: string[];
}

interface AppointmentType {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const PatientAppointmentBooking: React.FC = function PatientAppointmentBooking() {
  const { patientUser, isAuthenticated } = usePatientAuth();
  const navigate = useNavigate();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/patient/login');
      return;
    }

    fetchProviders();
    fetchAppointmentTypes();
  }, [isAuthenticated, navigate]);

  const fetchProviders = async () => {
    try {
      const response = await apiService.providers.getAll();
      if (response.success && response.data) {
        setProviders(response.data as Provider[]);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchAppointmentTypes = async () => {
    try {
      // Note: This would need to be implemented in apiService
      // For now, using mock data
      setAppointmentTypes([
        { _id: '1', name: 'Consulta Geral', description: 'Consulta odontológica geral', duration: 30, price: 150 },
        { _id: '2', name: 'Limpeza', description: 'Limpeza e profilaxia dental', duration: 60, price: 200 },
        { _id: '3', name: 'Tratamento de Canal', description: 'Tratamento endodôntico', duration: 90, price: 500 },
        { _id: '4', name: 'Extração', description: 'Extração dentária', duration: 45, price: 300 },
      ]);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
    }
  };

  const fetchAvailableSlots = async (providerId: string, date: string) => {
    try {
      setLoading(true);
      // Mock available time slots - in real implementation, this would call an API
      const slots: TimeSlot[] = [];
      const startHour = 8;
      const endHour = 18;

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          // Mock availability - randomly mark some as unavailable
          const available = Math.random() > 0.3;
          slots.push({ time: timeString, available });
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError('Erro ao carregar horários disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setSelectedTime('');
    if (selectedDate) {
      fetchAvailableSlots(providerId, selectedDate);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    if (selectedProvider) {
      fetchAvailableSlots(selectedProvider, date);
    }
  };

  const handleBooking = async () => {
    if (!selectedProvider || !selectedType || !selectedDate || !selectedTime) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setBooking(true);
      setError(null);

      const selectedTypeData = appointmentTypes.find(type => type._id === selectedType);
      if (!selectedTypeData) {
        throw new Error('Tipo de consulta não encontrado');
      }

      // Calculate end time based on duration
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + selectedTypeData.duration);

      const appointmentData = {
        patient: patientUser?.patient._id,
        provider: selectedProvider,
        appointmentType: selectedType,
        scheduledStart: startDateTime.toISOString(),
        scheduledEnd: endDateTime.toISOString(),
        status: 'scheduled' as const,
        notes: notes.trim() || undefined
      };

      const response = await apiService.appointments.create(appointmentData);

      if (response.success) {
        navigate('/patient/appointments', {
          state: { message: 'Consulta agendada com sucesso!' }
        });
      } else {
        setError(response.message || 'Erro ao agendar consulta');
      }
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      setError(err.message || 'Erro ao agendar consulta');
    } finally {
      setBooking(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // Allow booking up to 3 months in advance
    return maxDate.toISOString().split('T')[0];
  };

  if (!patientUser) {
    return (
      <div className="appointment-booking">
        <div className="booking-loading">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-booking">
      <PatientNavigation activePage="appointments" />

      <div className="booking-content">
        {/* Header */}
        <header className="booking-header">
          <div className="header-content">
            <h1 className="page-title">Agendar Consulta</h1>
            <button
              className="back-btn"
              onClick={() => navigate('/patient/appointments')}
            >
              ← Voltar
            </button>
          </div>
        </header>

        {/* Booking Form */}
        <main className="booking-main">
          <div className="booking-form">
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {/* Step 1: Select Provider */}
            <div className="form-section">
              <h2>1. Escolha o Dentista</h2>
              <div className="form-group">
                <label htmlFor="provider">Dentista *</label>
                <select
                  id="provider"
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">Selecione um dentista</option>
                  {providers.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      Dr. {provider.name} - {provider.specialties.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Select Appointment Type */}
            <div className="form-section">
              <h2>2. Tipo de Consulta</h2>
              <div className="form-group">
                <label htmlFor="appointmentType">Tipo de Consulta *</label>
                <select
                  id="appointmentType"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="form-select"
                >
                  <option value="">Selecione o tipo de consulta</option>
                  {appointmentTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name} - {type.duration}min - R$ {type.price}
                    </option>
                  ))}
                </select>
                {selectedType && (
                  <p className="field-description">
                    {appointmentTypes.find(type => type._id === selectedType)?.description}
                  </p>
                )}
              </div>
            </div>

            {/* Step 3: Select Date */}
            <div className="form-section">
              <h2>3. Escolha a Data</h2>
              <div className="form-group">
                <label htmlFor="date">Data *</label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="form-input"
                />
              </div>
            </div>

            {/* Step 4: Select Time */}
            {selectedDate && selectedProvider && (
              <div className="form-section">
                <h2>4. Escolha o Horário</h2>
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Carregando horários...</p>
                  </div>
                ) : (
                  <div className="time-slots">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        className={`time-slot ${selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'unavailable' : ''}`}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Additional Notes */}
            <div className="form-section">
              <h2>5. Observações (Opcional)</h2>
              <div className="form-group">
                <label htmlFor="notes">Observações</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva qualquer informação relevante para a consulta..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            {/* Booking Summary */}
            {selectedProvider && selectedType && selectedDate && selectedTime && (
              <div className="booking-summary">
                <h3>Resumo do Agendamento</h3>
                <div className="summary-details">
                  <p><strong>Dentista:</strong> Dr. {providers.find(p => p._id === selectedProvider)?.name}</p>
                  <p><strong>Tipo:</strong> {appointmentTypes.find(t => t._id === selectedType)?.name}</p>
                  <p><strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Horário:</strong> {selectedTime}</p>
                  <p><strong>Duração:</strong> {appointmentTypes.find(t => t._id === selectedType)?.duration} minutos</p>
                  <p><strong>Valor:</strong> R$ {appointmentTypes.find(t => t._id === selectedType)?.price}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/patient/appointments')}
                className="cancel-btn"
                disabled={booking}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBooking}
                className="book-btn"
                disabled={booking || !selectedProvider || !selectedType || !selectedDate || !selectedTime}
              >
                {booking ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Agendando...
                  </>
                ) : (
                  'Confirmar Agendamento'
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientAppointmentBooking;
