// src/components/Admin/Dashboard/Dashboard.tsx - Updated for Backend Integration
import React, { useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboard } from '../../../hooks/useApiState';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { stats, loading, error, fetchDashboardData, reset } = useDashboard();

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    await logout();
  };

  const handleRetry = () => {
    reset();
    fetchDashboardData();
  };

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Carregando dashboard...</div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="dashboard-error">
        <h2>Erro ao carregar dashboard</h2>
        <p>{error}</p>
        <button onClick={handleRetry}>Tentar novamente</button>
      </div>
    );
  }

  // UPDATED: Handle new backend data structure
  const safeStats = stats || {
    contacts: { 
      total: 0, 
      byStatus: [], 
      bySource: [], 
      recentCount: 0 
    },
    summary: { 
      totalContacts: 0, 
      newThisWeek: 0, 
      conversionRate: 0,
      revenue: 'R$ 0' 
    },
    user: { 
      name: user?.name || 'Usuário', 
      role: user?.role || 'admin' 
    }
  };

  // Helper function to calculate conversion rate
  const getConversionRate = () => {
    if (!safeStats.contacts.byStatus.length || safeStats.contacts.total === 0) {
      return 0;
    }
    
    const convertedCount = safeStats.contacts.byStatus.find(
      (s: { _id: string; count: number }) => s._id === 'converted'
    )?.count || 0;
    
    return Math.round((convertedCount / safeStats.contacts.total) * 100);
  };

  // Helper function to get status count
  const getStatusCount = (status: string): number => {
    return safeStats.contacts.byStatus.find(
      (s: { _id: string; count: number }) => s._id === status
    )?.count || 0;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Dashboard TopSmile</h1>
            <p>
              Bem-vindo, {safeStats.user.name} ({safeStats.user.role})
              {loading && <span className="loading-indicator"> • Atualizando...</span>}
            </p>
          </div>
          <div className="header-actions">
            <button onClick={handleLogout} className="logout-button">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        {error && stats && (
          <div className="error-banner">
            <span>⚠️ Erro ao atualizar dados: {error}</span>
            <button onClick={handleRetry} className="retry-button">Tentar novamente</button>
          </div>
        )}

        {/* UPDATED: Stats overview with new backend data */}
        <section className="stats-overview">
          <div className="stat-card">
            <h3>Total de Contatos</h3>
            <div className="stat-value">
              {safeStats.summary.totalContacts.toLocaleString('pt-BR')}
            </div>
          </div>
          
          <div className="stat-card">
            <h3>Novos esta Semana</h3>
            <div className="stat-value">
              {safeStats.summary.newThisWeek.toLocaleString('pt-BR')}
            </div>
          </div>
          
          <div className="stat-card">
            <h3>Taxa de Conversão</h3>
            <div className="stat-value">
              {getConversionRate()}%
            </div>
          </div>
          
          <div className="stat-card">
            <h3>Receita do Mês</h3>
            <div className="stat-value">
              {safeStats.summary.revenue || 'R$ 0'}
            </div>
          </div>
        </section>

        {/* UPDATED: Stats details with backend data structure */}
        <section className="stats-details">
          <div className="chart-container">
            <h3>Contatos por Status</h3>
            <div className="status-list">
              {safeStats.contacts.byStatus.length > 0 ? (
                safeStats.contacts.byStatus.map((item: { _id: string; count: number }) => (
                  <div key={item._id} className="status-item">
                    <span className="status-name">
                      {getStatusLabel(item._id)}
                    </span>
                    <span className="status-count">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>Nenhum contato encontrado</p>
                </div>
              )}
            </div>
          </div>

          <div className="chart-container">
            <h3>Origem dos Contatos</h3>
            <div className="source-list">
              {safeStats.contacts.bySource.length > 0 ? (
                safeStats.contacts.bySource.map((item: { _id: string; count: number }) => (
                  <div key={item._id} className="source-item">
                    <span className="source-name">
                      {getSourceLabel(item._id)}
                    </span>
                    <span className="source-count">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>Nenhuma origem encontrada</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* UPDATED: Enhanced actions section with navigation to all modules */}
        <section className="actions-section">
          <h3>Módulos do Sistema</h3>
          <div className="modules-grid">
            <div className="module-card">
              <div className="module-icon contacts">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="module-info">
                <h4>Gestão de Contatos</h4>
                <p>{safeStats.contacts.total} contatos cadastrados</p>
                <button
                  className="module-button"
                  onClick={() => window.location.href = '/admin/contacts'}
                >
                  Gerenciar Contatos
                </button>
              </div>
            </div>

            <div className="module-card">
              <div className="module-icon patients">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="module-info">
                <h4>Gestão de Pacientes</h4>
                <p>Cadastro e histórico médico</p>
                <button
                  className="module-button"
                  onClick={() => window.location.href = '/admin/patients'}
                >
                  Gerenciar Pacientes
                </button>
              </div>
            </div>

            <div className="module-card">
              <div className="module-icon providers">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="module-info">
                <h4>Gestão de Profissionais</h4>
                <p>Dentistas e especialistas</p>
                <button
                  className="module-button"
                  onClick={() => window.location.href = '/admin/providers'}
                >
                  Gerenciar Profissionais
                </button>
              </div>
            </div>

            <div className="module-card">
              <div className="module-icon appointments">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="module-info">
                <h4>Agenda de Consultas</h4>
                <p>Agendamentos e calendário</p>
                <button
                  className="module-button"
                  onClick={() => window.location.href = '/admin/appointments'}
                >
                  Ver Agenda
                </button>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h4>Ações Rápidas</h4>
            <div className="action-buttons">
              <button
                className="action-button secondary"
                onClick={() => fetchDashboardData()}
                disabled={loading}
              >
                {loading ? 'Atualizando...' : 'Atualizar Dados'}
              </button>
              <button 
                className="action-button secondary"
                onClick={() => window.location.href = '/admin/billing'}
              >
                Financeiro
              </button>
            </div>
          </div>
        </section>

        {/* UPDATED: Footer with user context */}
        <section className="dashboard-footer">
          <div className="last-updated">
            <small>
              Última atualização: {new Date().toLocaleString('pt-BR')}
              {safeStats.user.clinicId && ` • Clínica ID: ${safeStats.user.clinicId}`}
            </small>
          </div>
        </section>
      </main>
    </div>
  );
};

// Helper functions for better labels
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'new': 'Novos',
    'contacted': 'Contatados',
    'qualified': 'Qualificados',
    'converted': 'Convertidos',
    'closed': 'Fechados',
    'deleted': 'Excluídos',
    'merged': 'Mesclados'
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

const getSourceLabel = (source: string): string => {
  const labels: Record<string, string> = {
    'website_contact_form': 'Formulário do Site',
    'phone': 'Telefone',
    'email': 'E-mail',
    'referral': 'Indicação',
    'social_media': 'Redes Sociais',
    'advertisement': 'Publicidade'
  };
  return labels[source] || source.charAt(0).toUpperCase() + source.slice(1);
};

export default Dashboard;