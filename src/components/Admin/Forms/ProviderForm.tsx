// src/components/Admin/Forms/ProviderForm.tsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/apiService';
import type { Provider } from '../../../types/api';
import './ProviderForm.css';

interface ProviderFormProps {
  provider?: Provider | null;
  onSave: (provider: Provider) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface ProviderFormData {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  license: string;
  workingHours: {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
  };
  timeZone: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  appointmentTypes: string[];
  isActive: boolean;
}

const defaultWorkingHours = {
  monday: { start: '08:00', end: '18:00', isWorking: true },
  tuesday: { start: '08:00', end: '18:00', isWorking: true },
  wednesday: { start: '08:00', end: '18:00', isWorking: true },
  thursday: { start: '08:00', end: '18:00', isWorking: true },
  friday: { start: '08:00', end: '18:00', isWorking: true },
  saturday: { start: '08:00', end: '12:00', isWorking: false },
  sunday: { start: '08:00', end: '12:00', isWorking: false }
};

const specialtyOptions = [
  'Clínica Geral',
  'Ortodontia',
  'Implantodontia',
  'Endodontia',
  'Periodontia',
  'Cirurgia Oral',
  'Prótese Dentária',
  'Odontopediatria',
  'Estética Dental',
  'Radiologia Odontológica'
];

const appointmentTypeOptions = [
  'Consulta',
  'Limpeza',
  'Tratamento de Canal',
  'Extração',
  'Implante',
  'Ortodontia',
  'Clareamento',
  'Prótese',
  'Emergência'
];

const ProviderForm: React.FC<ProviderFormProps> = ({
  provider,
  onSave,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    email: '',
    phone: '',
    specialties: [],
    license: '',
    workingHours: defaultWorkingHours,
    timeZone: 'America/Sao_Paulo',
    bufferTimeBefore: 15,
    bufferTimeAfter: 15,
    appointmentTypes: [],
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (provider) {
      // Ensure working hours match the expected structure
      const workingHours = provider.workingHours ? {
        monday: provider.workingHours.monday || defaultWorkingHours.monday,
        tuesday: provider.workingHours.tuesday || defaultWorkingHours.tuesday,
        wednesday: provider.workingHours.wednesday || defaultWorkingHours.wednesday,
        thursday: provider.workingHours.thursday || defaultWorkingHours.thursday,
        friday: provider.workingHours.friday || defaultWorkingHours.friday,
        saturday: provider.workingHours.saturday || defaultWorkingHours.saturday,
        sunday: provider.workingHours.sunday || defaultWorkingHours.sunday
      } : defaultWorkingHours;

      setFormData({
        name: provider.name || '',
        email: provider.email || '',
        phone: provider.phone || '',
        specialties: provider.specialties || [],
        license: provider.license || '',
        workingHours,
        timeZone: provider.timeZone || 'America/Sao_Paulo',
        bufferTimeBefore: provider.bufferTimeBefore || 15,
        bufferTimeAfter: provider.bufferTimeAfter || 15,
        appointmentTypes: provider.appointmentTypes || [],
        isActive: provider.isActive !== false
      });
    }
  }, [provider]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialties: checked
        ? [...prev.specialties, specialty]
        : prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleAppointmentTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      appointmentTypes: checked
        ? [...prev.appointmentTypes, type]
        : prev.appointmentTypes.filter(t => t !== type)
    }));
  };

  const handleWorkingHoursChange = (
    day: keyof typeof formData.workingHours,
    field: 'start' | 'end' | 'isWorking',
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^[\d\s\-\(\)\+]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (formData.specialties.length === 0) {
      newErrors.specialties = 'Selecione pelo menos uma especialidade';
    }

    if (formData.appointmentTypes.length === 0) {
      newErrors.appointmentTypes = 'Selecione pelo menos um tipo de consulta';
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
      let result;
      if (provider?._id) {
        result = await apiService.providers.update(provider._id, formData);
      } else {
        result = await apiService.providers.create(formData);
      }

      if (result.success && result.data) {
        onSave(result.data);
      } else {
        setErrors({ submit: result.message || 'Erro ao salvar profissional' });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erro ao salvar profissional' });
    } finally {
      setSubmitting(false);
    }
  };

  const dayNames = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  return (
    <form onSubmit={handleSubmit} className="provider-form">
      {errors.submit && (
        <div className="error-banner">
          {errors.submit}
        </div>
      )}

      {/* Basic Information */}
      <div className="form-section">
        <h3>Informações Básicas</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Nome Completo *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              required
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={errors.phone ? 'error' : ''}
              placeholder="(11) 99999-9999"
              required
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="license">Registro Profissional</label>
            <input
              type="text"
              id="license"
              name="license"
              value={formData.license}
              onChange={handleInputChange}
              placeholder="CRO-SP 12345"
            />
          </div>

          <div className="form-group">
            <label htmlFor="timeZone">Fuso Horário</label>
            <select
              id="timeZone"
              name="timeZone"
              value={formData.timeZone}
              onChange={handleInputChange}
            >
              <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              Profissional ativo
            </label>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="form-section">
        <h3>Especialidades *</h3>
        <div className="checkbox-grid">
          {specialtyOptions.map(specialty => (
            <label key={specialty} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.specialties.includes(specialty)}
                onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
              />
              {specialty}
            </label>
          ))}
        </div>
        {errors.specialties && <span className="error-text">{errors.specialties}</span>}
      </div>

      {/* Appointment Types */}
      <div className="form-section">
        <h3>Tipos de Consulta *</h3>
        <div className="checkbox-grid">
          {appointmentTypeOptions.map(type => (
            <label key={type} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.appointmentTypes.includes(type)}
                onChange={(e) => handleAppointmentTypeChange(type, e.target.checked)}
              />
              {type}
            </label>
          ))}
        </div>
        {errors.appointmentTypes && <span className="error-text">{errors.appointmentTypes}</span>}
      </div>

      {/* Working Hours */}
      <div className="form-section">
        <h3>Horários de Trabalho</h3>
        <div className="working-hours-grid">
          {Object.entries(dayNames).map(([day, dayName]) => (
            <div key={day} className="working-hours-row">
              <div className="day-name">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.workingHours[day as keyof typeof formData.workingHours].isWorking}
                    onChange={(e) => handleWorkingHoursChange(
                      day as keyof typeof formData.workingHours,
                      'isWorking',
                      e.target.checked
                    )}
                  />
                  {dayName}
                </label>
              </div>
              
              {formData.workingHours[day as keyof typeof formData.workingHours].isWorking && (
                <div className="time-inputs">
                  <input
                    type="time"
                    value={formData.workingHours[day as keyof typeof formData.workingHours].start}
                    onChange={(e) => handleWorkingHoursChange(
                      day as keyof typeof formData.workingHours,
                      'start',
                      e.target.value
                    )}
                  />
                  <span>às</span>
                  <input
                    type="time"
                    value={formData.workingHours[day as keyof typeof formData.workingHours].end}
                    onChange={(e) => handleWorkingHoursChange(
                      day as keyof typeof formData.workingHours,
                      'end',
                      e.target.value
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Buffer Times */}
      <div className="form-section">
        <h3>Configurações de Agenda</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="bufferTimeBefore">Tempo de Preparação (minutos)</label>
            <input
              type="number"
              id="bufferTimeBefore"
              name="bufferTimeBefore"
              value={formData.bufferTimeBefore}
              onChange={handleInputChange}
              min="0"
              max="60"
            />
            <small>Tempo antes da consulta para preparação</small>
          </div>

          <div className="form-group">
            <label htmlFor="bufferTimeAfter">Tempo de Limpeza (minutos)</label>
            <input
              type="number"
              id="bufferTimeAfter"
              name="bufferTimeAfter"
              value={formData.bufferTimeAfter}
              onChange={handleInputChange}
              min="0"
              max="60"
            />
            <small>Tempo após a consulta para limpeza</small>
          </div>
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
          {submitting ? 'Salvando...' : provider ? 'Atualizar' : 'Criar'} Profissional
        </button>
      </div>
    </form>
  );
};

export default ProviderForm;