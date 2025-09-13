import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../../contexts/PatientAuthContext';
import { apiService } from '../../../services/apiService';
import PatientNavigation from '../../../components/PatientNavigation';
import './PatientProfile.css';

interface PatientData {
  name: string;
  email?: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  address?: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  medicalHistory?: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    notes?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

const PatientProfile: React.FC = () => {
  const { patientUser, isAuthenticated, refreshPatientData } = usePatientAuth();
  const navigate = useNavigate();

  const [patientData, setPatientData] = useState<PatientData>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: {
      street: '',
      number: '',
      city: '',
      state: '',
      zipCode: ''
    },
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      notes: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'emergency'>('personal');

  const loadPatientData = useCallback(() => {
    if (!patientUser?.patient) return;

    const patient = patientUser.patient;
    setPatientData({
      name: patient.name || '',
      email: patientUser.email || '',
      phone: patient.phone || '',
      birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : '',
      gender: patient.gender || '',
      address: patient.address || {
        street: '',
        number: '',
        city: '',
        state: '',
        zipCode: ''
      },
      medicalHistory: patient.medicalHistory || {
        allergies: [],
        medications: [],
        conditions: [],
        notes: ''
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });

    setLoading(false);
  }, [patientUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/patient/login');
      return;
    }

    loadPatientData();
  }, [isAuthenticated, navigate, loadPatientData]);

  const handleInputChange = (field: string, value: string) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setPatientData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleMedicalHistoryChange = (field: string, value: string | string[]) => {
    setPatientData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [field]: value
      }
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setPatientData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare data for API
      const updateData = {
        patient: {
          name: patientData.name,
          phone: patientData.phone,
          birthDate: patientData.birthDate ? new Date(patientData.birthDate).toISOString() : undefined,
          gender: patientData.gender,
          address: patientData.address,
          medicalHistory: patientData.medicalHistory
        }
      };

      if (!patientUser?.patient?._id) {
        setError('Dados do paciente não encontrados');
        return;
      }

      const response = await apiService.patients.update(patientUser.patient._id, {
        ...updateData.patient,
        gender: updateData.patient.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined
      });

      if (response.success) {
        setSuccess('Perfil atualizado com sucesso!');
        await refreshPatientData();
      } else {
        setError(response.message || 'Erro ao atualizar perfil');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const addArrayItem = (field: 'allergies' | 'medications' | 'conditions', value: string) => {
    if (!value.trim()) return;

    const currentArray = patientData.medicalHistory?.[field] || [];
    if (!currentArray.includes(value.trim())) {
      handleMedicalHistoryChange(field, [...currentArray, value.trim()]);
    }
  };

  const removeArrayItem = (field: 'allergies' | 'medications' | 'conditions', index: number) => {
    const currentArray = patientData.medicalHistory?.[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleMedicalHistoryChange(field, newArray);
  };

  if (!patientUser) {
    return (
      <div className="patient-profile">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-profile">
      <PatientNavigation activePage="profile" />

      <div className="profile-content">
        {/* Header */}
        <header className="profile-header">
          <div className="header-content">
            <h1 className="page-title">Meu Perfil</h1>
            <p className="page-subtitle">Gerencie suas informações pessoais e médicas</p>
          </div>
        </header>

        {/* Success/Error Messages */}
        {success && (
          <div className="success-message">
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Informações Pessoais
          </button>
          <button
            className={`tab-btn ${activeTab === 'medical' ? 'active' : ''}`}
            onClick={() => setActiveTab('medical')}
          >
            Histórico Médico
          </button>
          <button
            className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergency')}
          >
            Contato de Emergência
          </button>
        </div>

        {/* Tab Content */}
        <main className="profile-main">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Carregando perfil...</p>
            </div>
          ) : (
            <div className="profile-form">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="form-section">
                  <h2>Informações Pessoais</h2>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Nome Completo *</label>
                      <input
                        type="text"
                        id="name"
                        value={patientData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">E-mail</label>
                      <input
                        type="email"
                        id="email"
                        value={patientData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Telefone *</label>
                      <input
                        type="tel"
                        id="phone"
                        value={patientData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="birthDate">Data de Nascimento</label>
                      <input
                        type="date"
                        id="birthDate"
                        value={patientData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="gender">Gênero</label>
                      <select
                        id="gender"
                        value={patientData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Selecione</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                        <option value="prefer_not_to_say">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>

                  <h3>Endereço</h3>
                  <div className="form-grid">
                    <div className="form-group span-2">
                      <label htmlFor="street">Rua</label>
                      <input
                        type="text"
                        id="street"
                        value={patientData.address?.street || ''}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="number">Número</label>
                      <input
                        type="text"
                        id="number"
                        value={patientData.address?.number || ''}
                        onChange={(e) => handleAddressChange('number', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="city">Cidade</label>
                      <input
                        type="text"
                        id="city"
                        value={patientData.address?.city || ''}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="state">Estado</label>
                      <input
                        type="text"
                        id="state"
                        value={patientData.address?.state || ''}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="zipCode">CEP</label>
                      <input
                        type="text"
                        id="zipCode"
                        value={patientData.address?.zipCode || ''}
                        onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Medical History Tab */}
              {activeTab === 'medical' && (
                <div className="form-section">
                  <h2>Histórico Médico</h2>

                  {/* Allergies */}
                  <div className="array-field">
                    <label>Alergias</label>
                    <div className="array-input-group">
                      <input
                        type="text"
                        placeholder="Adicionar alergia..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('allergies', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addArrayItem('allergies', input.value);
                          input.value = '';
                        }}
                        className="add-btn"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="array-items">
                      {patientData.medicalHistory?.allergies?.map((allergy, index) => (
                        <span key={index} className="array-item">
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('allergies', index)}
                            className="remove-btn"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Medications */}
                  <div className="array-field">
                    <label>Medicamentos</label>
                    <div className="array-input-group">
                      <input
                        type="text"
                        placeholder="Adicionar medicamento..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('medications', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addArrayItem('medications', input.value);
                          input.value = '';
                        }}
                        className="add-btn"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="array-items">
                      {patientData.medicalHistory?.medications?.map((medication, index) => (
                        <span key={index} className="array-item">
                          {medication}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('medications', index)}
                            className="remove-btn"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="array-field">
                    <label>Condições Médicas</label>
                    <div className="array-input-group">
                      <input
                        type="text"
                        placeholder="Adicionar condição..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('conditions', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        className="form-input"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addArrayItem('conditions', input.value);
                          input.value = '';
                        }}
                        className="add-btn"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="array-items">
                      {patientData.medicalHistory?.conditions?.map((condition, index) => (
                        <span key={index} className="array-item">
                          {condition}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('conditions', index)}
                            className="remove-btn"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Medical Notes */}
                  <div className="form-group">
                    <label htmlFor="medicalNotes">Observações Médicas</label>
                    <textarea
                      id="medicalNotes"
                      value={patientData.medicalHistory?.notes || ''}
                      onChange={(e) => handleMedicalHistoryChange('notes', e.target.value)}
                      placeholder="Adicione observações relevantes sobre seu histórico médico..."
                      className="form-textarea"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Tab */}
              {activeTab === 'emergency' && (
                <div className="form-section">
                  <h2>Contato de Emergência</h2>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="emergencyName">Nome</label>
                      <input
                        type="text"
                        id="emergencyName"
                        value={patientData.emergencyContact?.name || ''}
                        onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="emergencyPhone">Telefone</label>
                      <input
                        type="tel"
                        id="emergencyPhone"
                        value={patientData.emergencyContact?.phone || ''}
                        onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="relationship">Relação</label>
                      <select
                        id="relationship"
                        value={patientData.emergencyContact?.relationship || ''}
                        onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Selecione</option>
                        <option value="spouse">Cônjuge</option>
                        <option value="parent">Pai/Mãe</option>
                        <option value="child">Filho/Filha</option>
                        <option value="sibling">Irmão/Irmã</option>
                        <option value="friend">Amigo</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="save-btn"
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner small"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientProfile;
