// src/pages/Admin/ProviderManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import type { Provider } from '../../types/api';
import EnhancedHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ProviderForm from '../../components/Admin/Forms/ProviderForm';
import './ProviderManagement.css';

interface ProviderFilters {
  search?: string;
  specialty?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

const ProviderManagement: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProviderFilters>({
    search: '',
    specialty: '',
    isActive: true,
    page: 1,
    limit: 20
  });
  const [total, setTotal] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Fetch providers from backend
  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams: Record<string, any> = {};

      if (filters.search) {
        queryParams.search = filters.search;
      }

      if (filters.specialty) {
        queryParams.specialty = filters.specialty;
      }

      if (filters.isActive !== undefined) {
        queryParams.isActive = filters.isActive;
      }

      if (filters.page) {
        queryParams.page = filters.page;
      }

      if (filters.limit) {
        queryParams.limit = filters.limit;
      }

      // Call API service
      const result = await apiService.providers.getAll(queryParams);

      if (result.success && result.data) {
        setProviders(result.data);
        setTotal(result.data.length); // Note: Backend should return total count in pagination
      } else {
        setError(result.message || 'Erro ao carregar profissionais');
        setProviders([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (key: keyof ProviderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const formatWorkingHours = (workingHours: Provider['workingHours']) => {
    const workingDays = Object.entries(workingHours)
      .filter(([_, hours]) => hours.isWorking)
      .map(([day, hours]) => {
        const dayNames: Record<string, string> = {
          monday: 'Seg',
          tuesday: 'Ter',
          wednesday: 'Qua',
          thursday: 'Qui',
          friday: 'Sex',
          saturday: 'Sáb',
          sunday: 'Dom'
        };
        return `${dayNames[day]}: ${hours.start}-${hours.end}`;
      });

    return workingDays.length > 0 ? workingDays.join(', ') : 'Não definido';
  };

  const getAvailabilityStatus = (provider: Provider) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = provider.workingHours[currentDay as keyof typeof provider.workingHours];
    
    if (!todayHours?.isWorking) {
      return { status: 'unavailable', label: 'Indisponível hoje' };
    }

    if (currentTime >= todayHours.start && currentTime <= todayHours.end) {
      return { status: 'available', label: 'Disponível agora' };
    }

    return { status: 'offline', label: 'Fora do horário' };
  };

  if (loading && providers.length === 0) {
    return (
      <div className="provider-management-page">
        <EnhancedHeader />
        <main className="provider-management-main">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner">Carregando profissionais...</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="provider-management-page">
      <EnhancedHeader />

      <main className="provider-management-main">
        <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Gestão de Profissionais</h1>
          <p>Gerencie os profissionais da sua clínica</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Profissional
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou especialidade..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Especialidade:</label>
            <select
              value={filters.specialty || ''}
              onChange={(e) => handleFilterChange('specialty', e.target.value || undefined)}
              className="filter-select"
            >
              <option value="">Todas</option>
              <option value="ortodontia">Ortodontia</option>
              <option value="implantodontia">Implantodontia</option>
              <option value="endodontia">Endodontia</option>
              <option value="cirurgia">Cirurgia Oral</option>
              <option value="clinica geral">Clínica Geral</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
              onChange={(e) => handleFilterChange('isActive', e.target.value === 'all' ? undefined : e.target.value === 'true')}
              className="filter-select"
            >
              <option value="all">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchProviders} className="retry-button">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <span>{total} profissional{total !== 1 ? 'is' : ''} encontrado{total !== 1 ? 's' : ''}</span>
        {loading && <span className="loading-indicator">Atualizando...</span>}
      </div>

      {/* Providers Grid */}
      <div className="providers-grid">
        {providers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-content">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3>Nenhum profissional encontrado</h3>
              <p>Tente ajustar os filtros ou adicione um novo profissional</p>
            </div>
          </div>
        ) : (
          providers.map((provider) => {
            const availability = getAvailabilityStatus(provider);
            return (
              <div key={provider._id} className="provider-card">
                <div className="provider-header">
                  <div className="provider-info">
                    <h3 className="provider-name">{provider.name}</h3>
                    <p className="provider-license">{provider.license}</p>
                  </div>
                  <div className={`availability-indicator ${availability.status}`}>
                    <span className="availability-dot"></span>
                    <span className="availability-text">{availability.label}</span>
                  </div>
                </div>

                <div className="provider-details">
                  <div className="detail-row">
                    <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{provider.email}</span>
                  </div>

                  <div className="detail-row">
                    <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{provider.phone}</span>
                  </div>

                  <div className="specialties">
                    <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="specialty-tags">
                      {provider.specialties.map((specialty, index) => (
                        <span key={index} className="specialty-tag">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="working-hours">
                    <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hours-text">{formatWorkingHours(provider.workingHours)}</span>
                  </div>
                </div>

                <div className="provider-footer">
                  <div className="provider-status">
                    <span className={`status-badge ${provider.isActive ? 'active' : 'inactive'}`}>
                      {provider.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="provider-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setSelectedProvider(provider)}
                      title="Ver detalhes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setEditingProvider(provider)}
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => {/* TODO: View schedule */ }}
                      title="Ver agenda"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <div className="modal-overlay" onClick={() => setSelectedProvider(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes do Profissional</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedProvider(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="provider-details-modal">
                <div className="detail-section">
                  <h3>Informações Básicas</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Nome:</label>
                      <span>{selectedProvider.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedProvider.email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Telefone:</label>
                      <span>{selectedProvider.phone}</span>
                    </div>
                    <div className="detail-item">
                      <label>Registro:</label>
                      <span>{selectedProvider.license}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Especialidades</h3>
                  <div className="specialty-tags">
                    {selectedProvider.specialties.map((specialty, index) => (
                      <span key={index} className="specialty-tag">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Horários de Trabalho</h3>
                  <div className="working-hours-grid">
                    {Object.entries(selectedProvider.workingHours).map(([day, hours]) => {
                      const dayNames: Record<string, string> = {
                        monday: 'Segunda-feira',
                        tuesday: 'Terça-feira',
                        wednesday: 'Quarta-feira',
                        thursday: 'Quinta-feira',
                        friday: 'Sexta-feira',
                        saturday: 'Sábado',
                        sunday: 'Domingo'
                      };

                      return (
                        <div key={day} className="working-hours-item">
                          <span className="day-name">{dayNames[day]}:</span>
                          <span className={`hours ${hours.isWorking ? 'working' : 'not-working'}`}>
                            {hours.isWorking ? `${hours.start} - ${hours.end}` : 'Não trabalha'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Configurações</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Tempo de preparação:</label>
                      <span>{selectedProvider.bufferTimeBefore} minutos antes</span>
                    </div>
                    <div className="detail-item">
                      <label>Tempo de limpeza:</label>
                      <span>{selectedProvider.bufferTimeAfter} minutos depois</span>
                    </div>
                    <div className="detail-item">
                      <label>Fuso horário:</label>
                      <span>{selectedProvider.timeZone}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${selectedProvider.isActive ? 'active' : 'inactive'}`}>
                        {selectedProvider.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Tipos de Consulta</h3>
                  <div className="appointment-types">
                    {selectedProvider.appointmentTypes.map((type, index) => (
                      <span key={index} className="appointment-type-tag">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setSelectedProvider(null)}
              >
                Fechar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {/* TODO: Edit provider */ }}
              >
                Editar Profissional
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Provider Modal */}
      {(showAddModal || editingProvider) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setEditingProvider(null);
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProvider ? 'Editar Profissional' : 'Novo Profissional'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProvider(null);
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <ProviderForm
                provider={editingProvider}
                onSave={(provider) => {
                  // Update the providers list
                  if (editingProvider) {
                    setProviders(prev => prev.map(p => p._id === provider._id ? provider : p));
                  } else {
                    setProviders(prev => [provider, ...prev]);
                    setTotal(prev => prev + 1);
                  }
                  
                  // Close modal
                  setShowAddModal(false);
                  setEditingProvider(null);
                }}
                onCancel={() => {
                  setShowAddModal(false);
                  setEditingProvider(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProviderManagement;