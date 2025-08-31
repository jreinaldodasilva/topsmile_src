// src/components/Admin/Dashboard/Dashboard.tsx
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

  const handleLogout = () => {
    logout();
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Dashboard TopSmile</h1>
            <p>
              Bem-vindo, {stats?.user?.name || user?.name} ({stats?.user?.role || user?.role})
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

        {stats && (
          <>
            <section className="stats-overview">
              <div className="stat-card">
                <h3>Total de Contatos</h3>
                <div className="stat-value">{stats.summary.totalContacts.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <h3>Novos esta Semana</h3>
                <div className="stat-value">{stats.summary.newThisWeek.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <h3>Taxa de Conversão</h3>
                <div className="stat-value">
                  {stats.contacts.total > 0
                    ? `${Math.round((stats.contacts.byStatus.find((s: { _id: string }) => s._id === 'converted')?.count || 0) / stats.contacts.total * 100)}%`
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="stat-card">
                <h3>Receita do Mês</h3>
                <div className="stat-value">{stats.summary.revenue}</div>
              </div>
            </section>

            <section className="stats-details">
              <div className="chart-container">
                <h3>Contatos por Status</h3>
                <div className="status-list">
                  {stats.contacts.byStatus.length > 0 ? (
                    stats.contacts.byStatus.map((item: { _id: string; count: number }) => (
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
                  {stats.contacts.bySource.length > 0 ? (
                    stats.contacts.bySource.map((item: { _id: string; count: number }) => (
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

            <section className="actions-section">
              <h3>Ações Rápidas</h3>
              <div className="action-buttons">
                <button
                  className="action-button primary"
                  onClick={() => window.location.href = '/admin/contacts'}
                >
                  Ver Todos os Contatos ({stats.contacts.total})
                </button>
                <button
                  className="action-button secondary"
                  onClick={() => fetchDashboardData()}
                  disabled={loading}
                >
                  {loading ? 'Atualizando...' : 'Atualizar Dados'}
                </button>
                <button className="action-button secondary">
                  Configurações
                </button>
              </div>
            </section>

            <section className="dashboard-footer">
              <div className="last-updated">
                <small>
                  Última atualização: {new Date().toLocaleString('pt-BR')}
                  {stats.user.clinicId && ` • Clínica ID: ${stats.user.clinicId}`}
                </small>
              </div>
            </section>
          </>
        )}
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
    'closed': 'Fechados'
  };
  return labels[status] || status;
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
  return labels[source] || source;
};

export default Dashboard;