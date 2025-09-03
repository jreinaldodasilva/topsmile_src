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

        {/* UPDATED: Actions section with new contact count */}
        <section className="actions-section">
          <h3>Ações Rápidas</h3>
          <div className="action-buttons">
            <button
              className="action-button primary"
              onClick={() => window.location.href = '/admin/contacts'}
            >
              Ver Todos os Contatos ({safeStats.contacts.total})
            </button>
            <button
              className="action-button secondary"
              onClick={() => fetchDashboardData()}
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar Dados'}
            </button>
            <button 
              className="action-button secondary"
              onClick={() => window.location.href = '/admin/settings'}
            >
              Configurações
            </button>
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