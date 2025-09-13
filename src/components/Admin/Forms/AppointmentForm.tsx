// src/components/Admin/Forms/AppointmentForm.tsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/apiService';
import type { Appointment, Patient, Provider, AppointmentType } from '../../../types/api';
import './AppointmentForm.css';

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onSave: (appointment: Appointment) => void;
  onCancel: () => void;
  loading?: boolean;
  preselectedPatient?: Patient;
  preselectedProvider?: Provider;
  preselectedDate?: string;
  preselectedTime?: string;
}

interface AppointmentFormData {
  patientId: string;
  providerId: string;
  appointmentTypeId: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'routine' | 'urgent' | 'emergency';
  notes: string;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  onSave,
  onCancel,
  loading = false,
  preselectedPatient,
  preselectedProvider,
  preselectedDate,
  preselectedTime
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: '',
    providerId: '',
    appointmentTypeId: '',
    scheduledStart: '',
    scheduledEnd: '',
    status: 'scheduled',
    priority: 'routine',
    notes: ''
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        const [patientsResult, providersResult] = await Promise.all([
          apiService.patients.getAll({ isActive: true, limit: 100 }),
          apiService.providers.getAll({ isActive: true })
        ]);

        if (patientsResult.success && patientsResult.data) {
          setPatients(Array.isArray(patientsResult.data) ? patientsResult.data : []);
        }

        if (providersResult.success && providersResult.data) {
          setProviders(providersResult.data);
        }

        // For now, we'll use a default set of appointment types
        setAppointmentTypes([
          { _id: '1', name: 'Consulta', duration: 30, price: 100, color: '#3182ce', category: 'general', isActive: true, clinic: '' },
          { _id: '2', name: 'Limpeza', duration: 45, price: 80, color: '#10b981', category: 'preventive', isActive: true, clinic: '' },
          { _id: '3', name: 'Tratamento de Canal', duration: 90, price: 300, color: '#f59e0b', category: 'treatment', isActive: true, clinic: '' },
          { _id: '4', name: 'Extração', duration: 60, price: 150, color: '#ef4444', category: 'surgery', isActive: true, clinic: '' },
          { _id: '5', name: 'Implante', duration: 120, price: 800, color: '#8b5cf6', category: 'surgery', isActive: true, clinic: '' }
        ]);

      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Set initial form data
  useEffect(() => {
    if (appointment) {
      const start = new Date(appointment.scheduledStart);
      const end = new Date(appointment.scheduledEnd);
      
      setFormData({
        patientId: typeof appointment.patient === 'string' ? appointment.patient : appointment.patient._id || '',
        providerId: typeof appointment.provider === 'string' ? appointment.provider : appointment.provider._id || '',
        appointmentTypeId: typeof appointment.appointmentType === 'string' ? appointment.appointmentType : appointment.appointmentType._id || '',
        scheduledStart: start.toISOString().slice(0, 16),
        scheduledEnd: end.toISOString().slice(0, 16),
        status: appointment.status,
        priority: appointment.priority || 'routine',
        notes: appointment.notes || ''
      });
    } else {
      // Set preselected values
      const now = new Date();
      const defaultStart = preselectedDate && preselectedTime 
        ? `${preselectedDate}T${preselectedTime}`
        : now.toISOString().slice(0, 16);
      
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setMinutes(defaultEnd.getMinutes() + 30);

      setFormData(prev => ({
        ...prev,
        patientId: preselectedPatient?._id || '',
        providerId: preselectedProvider?._id || '',
        scheduledStart: defaultStart,
        scheduledEnd: defaultEnd.toISOString().slice(0, 16)
      }));
    }
  }, [appointment, preselectedPatient, preselectedProvider, preselectedDate, preselectedTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate end time when appointment type changes
    if (name === 'appointmentTypeId') {
      const selectedType = appointmentTypes.find(type => type._id === value);
      if (selectedType && formData.scheduledStart) {
        const start = new Date(formData.scheduledStart);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + selectedType.duration);
        setFormData(prev => ({
          ...prev,
          scheduledEnd: end.toISOString().slice(0, 16)
        }));
      }
    }

    // Auto-calculate end time when start time changes
    if (name === 'scheduledStart' && formData.appointmentTypeId) {
      const selectedType = appointmentTypes.find(type => type._id === formData.appointmentTypeId);
      if (selectedType) {
        const start = new Date(value);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + selectedType.duration);
        setFormData(prev => ({
          ...prev,
          scheduledEnd: end.toISOString().slice(0, 16)
        }));
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = 'Selecione um paciente';
    }

    if (!formData.providerId) {
      newErrors.providerId = 'Selecione um profissional';
    }

    if (!formData.appointmentTypeId) {
      newErrors.appointmentTypeId = 'Selecione o tipo de consulta';
    }

    if (!formData.scheduledStart) {
      newErrors.scheduledStart = 'Data e hora de início são obrigatórias';
    }

    if (!formData.scheduledEnd) {
      newErrors.scheduledEnd = 'Data e hora de fim são obrigatórias';
    }

    if (formData.scheduledStart && formData.scheduledEnd) {
      const start = new Date(formData.scheduledStart);
      const end = new Date(formData.scheduledEnd);
      
      if (end <= start) {
        newErrors.scheduledEnd = 'Hora de fim deve ser posterior à hora de início';
      }

      if (start < new Date()) {
        newErrors.scheduledStart = 'Não é possível agendar no passado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const appointmentData = {
        patient: formData.patientId,
        provider: formData.providerId,
        appointmentType: formData.appointmentTypeId,
        scheduledStart: new Date(formData.scheduledStart).toISOString(),
        scheduledEnd: new Date(formData.scheduledEnd).toISOString(),
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes
      };

      let result;
      if (appointment?._id) {
        result = await apiService.appointments.update(appointment._id, appointmentData);
      } else {
        result = await apiService.appointments.create(appointmentData);
      }

      if (result.success && result.data) {
        onSave(result.data);
      } else {
        setErrors({ submit: result.message || 'Erro ao salvar agendamento' });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erro ao salvar agendamento' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="appointment-form">
        <div className="loading-container">
          <div className="loading-spinner">Carregando dados...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="appointment-form">
      {errors.submit && (
        <div className="error-banner">
          {errors.submit}
        </div>
      )}

      {/* Basic Information */}
      <div className="form-section">
        <h3>Informações da Consulta</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="patientId">Paciente *</label>
            <select
              id="patientId"
              name="patientId"
              value={formData.patientId}
              onChange={handleInputChange}
              className={errors.patientId ? 'error' : ''}
              required
            >
              <option value="">Selecione um paciente</option>
              {patients.map(patient => (
                <option key={patient._id} value={patient._id}>
                  {patient.fullName} - {patient.phone}
                </option>
              ))}
            </select>
            {errors.patientId && <span className="error-text">{errors.patientId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="providerId">Profissional *</label>
            <select
              id="providerId"
              name="providerId"
              value={formData.providerId}
              onChange={handleInputChange}
              className={errors.providerId ? 'error' : ''}
              required
            >
              <option value="">Selecione um profissional</option>
              {providers.map(provider => (
                <option key={provider._id} value={provider._id}>
                  {provider.name} - {provider.specialties.join(', ')}
                </option>
              ))}
            </select>
            {errors.providerId && <span className="error-text">{errors.providerId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="appointmentTypeId">Tipo de Consulta *</label>
            <select
              id="appointmentTypeId"
              name="appointmentTypeId"
              value={formData.appointmentTypeId}
              onChange={handleInputChange}
              className={errors.appointmentTypeId ? 'error' : ''}
              required
            >
              <option value="">Selecione o tipo</option>
              {appointmentTypes.map(type => (
                <option key={type._id} value={type._id}>
                  {type.name} ({type.duration} min) - R$ {type.price}
                </option>
              ))}
            </select>
            {errors.appointmentTypeId && <span className="error-text">{errors.appointmentTypeId}</span>}
          </div>
        </div>
      </div>

      {/* Date and Time */}
      <div className="form-section">
        <h3>Data e Horário</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="scheduledStart">Data e Hora de Início *</label>
            <input
              type="datetime-local"
              id="scheduledStart"
              name="scheduledStart"
              value={formData.scheduledStart}
              onChange={handleInputChange}
              className={errors.scheduledStart ? 'error' : ''}
              required
            />
            {errors.scheduledStart && <span className="error-text">{errors.scheduledStart}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="scheduledEnd">Data e Hora de Fim *</label>
            <input
              type="datetime-local"
              id="scheduledEnd"
              name="scheduledEnd"
              value={formData.scheduledEnd}
              onChange={handleInputChange}
              className={errors.scheduledEnd ? 'error' : ''}
              required
            />
            {errors.scheduledEnd && <span className="error-text">{errors.scheduledEnd}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="checked_in">Check-in</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
              <option value="no_show">Faltou</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Prioridade</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="routine">Rotina</option>
              <option value="urgent">Urgente</option>
              <option value="emergency">Emergência</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="form-section">
        <h3>Observações</h3>
        <div className="form-group">
          <label htmlFor="notes">Observações</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            placeholder="Observações sobre a consulta..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || loading}
        >
          {submitting ? 'Salvando...' : appointment ? 'Atualizar' : 'Agendar'} Consulta
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;