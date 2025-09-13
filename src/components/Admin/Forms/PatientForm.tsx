// src/components/Admin/Forms/PatientForm.tsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/apiService';
import type { Patient } from '../../../types/api';
import './PatientForm.css';

interface PatientFormProps {
  patient?: Patient | null;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';
  cpf: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    notes: string;
  };
}

const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSave,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    cpf: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      notes: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        gender: patient.gender || '',
        cpf: patient.cpf || '',
        address: {
          street: patient.address?.street || '',
          number: patient.address?.number || '',
          neighborhood: patient.address?.neighborhood || '',
          city: patient.address?.city || '',
          state: patient.address?.state || '',
          zipCode: patient.address?.zipCode || ''
        },
        emergencyContact: {
          name: patient.emergencyContact?.name || '',
          phone: patient.emergencyContact?.phone || '',
          relationship: patient.emergencyContact?.relationship || ''
        },
        medicalHistory: {
          allergies: patient.medicalHistory?.allergies || [],
          medications: patient.medicalHistory?.medications || [],
          conditions: patient.medicalHistory?.conditions || [],
          notes: patient.medicalHistory?.notes || ''
        }
      });
    }
  }, [patient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => {
        const sectionKey = section as keyof PatientFormData;
        const currentSection = prev[sectionKey];
        
        // Ensure we're only spreading object types
        if (typeof currentSection === 'object' && currentSection !== null && !Array.isArray(currentSection)) {
          return {
            ...prev,
            [section]: {
              ...currentSection,
              [field]: value
            }
          };
        }
        
        return prev;
      });
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

  const handleArrayInputChange = (section: 'allergies' | 'medications' | 'conditions', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [section]: items
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^[\d\s\-()+]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (formData.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf)) {
      newErrors.cpf = 'CPF deve estar no formato XXX.XXX.XXX-XX';
    }

    if (formData.address.zipCode && !/^\d{5}-?\d{3}$/.test(formData.address.zipCode)) {
      newErrors['address.zipCode'] = 'CEP deve estar no formato XXXXX-XXX';
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
      const patientData = {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        // Convert empty string to undefined for gender to match Patient type
        gender: formData.gender === '' ? undefined : formData.gender
      };

      let result;
      if (patient?._id) {
        result = await apiService.patients.update(patient._id, patientData);
      } else {
        result = await apiService.patients.create(patientData);
      }

      if (result.success && result.data) {
        onSave(result.data);
      } else {
        setErrors({ submit: result.message || 'Erro ao salvar paciente' });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erro ao salvar paciente' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="patient-form">
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
            <label htmlFor="firstName">Nome *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={errors.firstName ? 'error' : ''}
              required
            />
            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Sobrenome</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
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
            <label htmlFor="dateOfBirth">Data de Nascimento</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gênero</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
            >
              <option value="">Selecione</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
              <option value="prefer_not_to_say">Prefere não dizer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cpf">CPF</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              className={errors.cpf ? 'error' : ''}
              placeholder="000.000.000-00"
            />
            {errors.cpf && <span className="error-text">{errors.cpf}</span>}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="form-section">
        <h3>Endereço</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="address.street">Rua</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.number">Número</label>
            <input
              type="text"
              id="address.number"
              name="address.number"
              value={formData.address.number}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.neighborhood">Bairro</label>
            <input
              type="text"
              id="address.neighborhood"
              name="address.neighborhood"
              value={formData.address.neighborhood}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.city">Cidade</label>
            <input
              type="text"
              id="address.city"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.state">Estado</label>
            <input
              type="text"
              id="address.state"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
              maxLength={2}
              placeholder="SP"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address.zipCode">CEP</label>
            <input
              type="text"
              id="address.zipCode"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleInputChange}
              className={errors['address.zipCode'] ? 'error' : ''}
              placeholder="00000-000"
            />
            {errors['address.zipCode'] && <span className="error-text">{errors['address.zipCode']}</span>}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="form-section">
        <h3>Contato de Emergência</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="emergencyContact.name">Nome</label>
            <input
              type="text"
              id="emergencyContact.name"
              name="emergencyContact.name"
              value={formData.emergencyContact.name}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emergencyContact.phone">Telefone</label>
            <input
              type="tel"
              id="emergencyContact.phone"
              name="emergencyContact.phone"
              value={formData.emergencyContact.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emergencyContact.relationship">Parentesco</label>
            <input
              type="text"
              id="emergencyContact.relationship"
              name="emergencyContact.relationship"
              value={formData.emergencyContact.relationship}
              onChange={handleInputChange}
              placeholder="Ex: Mãe, Pai, Cônjuge"
            />
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="form-section">
        <h3>Histórico Médico</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="allergies">Alergias</label>
            <input
              type="text"
              id="allergies"
              value={formData.medicalHistory.allergies.join(', ')}
              onChange={(e) => handleArrayInputChange('allergies', e.target.value)}
              placeholder="Separe por vírgulas"
            />
          </div>

          <div className="form-group">
            <label htmlFor="medications">Medicamentos</label>
            <input
              type="text"
              id="medications"
              value={formData.medicalHistory.medications.join(', ')}
              onChange={(e) => handleArrayInputChange('medications', e.target.value)}
              placeholder="Separe por vírgulas"
            />
          </div>

          <div className="form-group">
            <label htmlFor="conditions">Condições Médicas</label>
            <input
              type="text"
              id="conditions"
              value={formData.medicalHistory.conditions.join(', ')}
              onChange={(e) => handleArrayInputChange('conditions', e.target.value)}
              placeholder="Separe por vírgulas"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="medicalHistory.notes">Observações</label>
            <textarea
              id="medicalHistory.notes"
              name="medicalHistory.notes"
              value={formData.medicalHistory.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Observações adicionais sobre o histórico médico"
            />
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
          {submitting ? 'Salvando...' : patient ? 'Atualizar' : 'Criar'} Paciente
        </button>
      </div>
    </form>
  );
};

export default PatientForm;