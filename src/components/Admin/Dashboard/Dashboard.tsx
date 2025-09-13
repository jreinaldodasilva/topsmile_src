// src/components/Admin/Dashboard/EnhancedDashboard.tsx
import React, { useState, useEffect } from 'react';
import Button from '../../UI/Button/Button';
import './Dashboard.css';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  satisfaction: number;
  trends: {
    patients: number;
    appointments: number;
    revenue: number;
    satisfaction: number;
  };
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface RecentPatient {
  id: string;
  name: string;
  lastVisit: Date;
  nextAppointment?: Date;
  status: 'active' | 'inactive';
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: Date;
  completed: boolean;
}

const EnhancedDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    satisfaction: 0,
    trends: { patients: 0, appointments: 0, revenue: 0, satisfaction: 0 }
  });
  
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalPatients: 1247,
        todayAppointments: 12,
        monthlyRevenue: 45680,
        satisfaction: 4.8,
        trends: {
          patients: 12,
          appointments: 8,
          revenue: 15,
          satisfaction: 5
        }
      });

      setUpcomingAppointments([
        {
          id: '1',
          patientName: 'Maria Silva',
          time: '09:00',
          type: 'Limpeza',
          status: 'scheduled'
        },
        {
          id: '2',
          patientName: 'João Santos',
          time: '10:30',
          type: 'Consulta',
          status: 'in-progress'
        },
        {
          id: '3',
          patientName: 'Ana Costa',
          time: '14:00',
          type: 'Tratamento',
          status: 'scheduled'
        }
      ]);

      setRecentPatients([
        {
          id: '1',
          name: 'Carlos Oliveira',
          lastVisit: new Date('2024-01-15'),
          nextAppointment: new Date('2024-02-20'),
          status: 'active'
        },
        {
          id: '2',
          name: 'Lucia Ferreira',
          lastVisit: new Date('2024-01-10'),
          status: 'inactive'
        }
      ]);

      setPendingTasks([
        {
          id: '1',
          title: 'Confirmar consulta de amanhã',
          priority: 'high',
          dueDate: new Date(),
          completed: false
        },
        {
          id: '2',
          title: 'Atualizar fichas médicas',
          priority: 'medium',
          dueDate: new Date('2024-02-25'),
          completed: false
        }
      ]);

      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <svg className="dashboard__trend-icon dashboard__trend-icon--up" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (trend < 0) {
      return (
        <svg className="dashboard__trend-icon dashboard__trend-icon--down" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="dashboard__trend-icon dashboard__trend-icon--neutral" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'dashboard__status--scheduled',
      'in-progress': 'dashboard__status--in-progress',
      completed: 'dashboard__status--completed',
      cancelled: 'dashboard__status--cancelled',
      active: 'dashboard__status--active',
      inactive: 'dashboard__status--inactive'
    };
    return colors[status as keyof typeof colors] || '';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'dashboard__priority--high',
      medium: 'dashboard__priority--medium',
      low: 'dashboard__priority--low'
    };
    return colors[priority as keyof typeof colors] || '';
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="dashboard__loading">
            <div className="dashboard__loading-content">
              <div className="loading-shimmer dashboard__loading-header"></div>
              <div className="dashboard__loading-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="loading-shimmer dashboard__loading-card"></div>
                ))}
              </div>
              <div className="dashboard__loading-widgets">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="loading-shimmer dashboard__loading-widget"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <div className="dashboard__title-section">
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__subtitle">
              Bem-vindo de volta! Aqui está um resumo do seu consultório.
            </p>
          </div>
          <div className="dashboard__actions">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              size="sm"
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Atualizar
            </Button>
            <Button variant="primary" size="sm">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nova Consulta
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="dashboard__stats">
          <div className="dashboard__stat-card">
            <div className="dashboard__stat-icon dashboard__stat-icon--patients">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="dashboard__stat-content">
              <div className="dashboard__stat-header">
                <h3 className="dashboard__stat-title">Total de Pacientes</h3>
                <div className="dashboard__stat-trend">
                  {getTrendIcon(stats.trends.patients)}
                  <span className={stats.trends.patients > 0 ? 'dashboard__trend-value--positive' : 'dashboard__trend-value--negative'}>
                    {Math.abs(stats.trends.patients)}%
                  </span>
                </div>
              </div>
              <div className="dashboard__stat-value">{stats.totalPatients.toLocaleString()}</div>
              <p className="dashboard__stat-description">vs mês anterior</p>
            </div>
          </div>

          <div className="dashboard__stat-card">
            <div className="dashboard__stat-icon dashboard__stat-icon--appointments">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="dashboard__stat-content">
              <div className="dashboard__stat-header">
                <h3 className="dashboard__stat-title">Consultas Hoje</h3>
                <div className="dashboard__stat-trend">
                  {getTrendIcon(stats.trends.appointments)}
                  <span className={stats.trends.appointments > 0 ? 'dashboard__trend-value--positive' : 'dashboard__trend-value--negative'}>
                    {Math.abs(stats.trends.appointments)}%
                  </span>
                </div>
              </div>
              <div className="dashboard__stat-value">{stats.todayAppointments}</div>
              <p className="dashboard__stat-description">esta semana</p>
            </div>
          </div>

          <div className="dashboard__stat-card">
            <div className="dashboard__stat-icon dashboard__stat-icon--revenue">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="dashboard__stat-content">
              <div className="dashboard__stat-header">
                <h3 className="dashboard__stat-title">Receita Mensal</h3>
                <div className="dashboard__stat-trend">
                  {getTrendIcon(stats.trends.revenue)}
                  <span className={stats.trends.revenue > 0 ? 'dashboard__trend-value--positive' : 'dashboard__trend-value--negative'}>
                    {Math.abs(stats.trends.revenue)}%
                  </span>
                </div>
              </div>
              <div className="dashboard__stat-value">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="dashboard__stat-description">este mês</p>
            </div>
          </div>

          <div className="dashboard__stat-card">
            <div className="dashboard__stat-icon dashboard__stat-icon--satisfaction">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="dashboard__stat-content">
              <div className="dashboard__stat-header">
                <h3 className="dashboard__stat-title">Satisfação</h3>
                <div className="dashboard__stat-trend">
                  {getTrendIcon(stats.trends.satisfaction)}
                  <span className={stats.trends.satisfaction > 0 ? 'dashboard__trend-value--positive' : 'dashboard__trend-value--negative'}>
                    {Math.abs(stats.trends.satisfaction)}%
                  </span>
                </div>
              </div>
              <div className="dashboard__stat-value">{stats.satisfaction}/5</div>
              <p className="dashboard__stat-description">avaliação média</p>
            </div>
          </div>
        </div>

        {/* Widgets */}
        <div className="dashboard__widgets">
          {/* Upcoming Appointments */}
          <div className="dashboard__widget">
            <div className="dashboard__widget-header">
              <h3 className="dashboard__widget-title">Próximas Consultas</h3>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </div>
            <div className="dashboard__widget-content">
              {upcomingAppointments.length > 0 ? (
                <div className="dashboard__appointments-list">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="dashboard__appointment-item">
                      <div className="dashboard__appointment-time">
                        {appointment.time}
                      </div>
                      <div className="dashboard__appointment-details">
                        <h4 className="dashboard__appointment-patient">{appointment.patientName}</h4>
                        <p className="dashboard__appointment-type">{appointment.type}</p>
                      </div>
                      <div className={`dashboard__appointment-status ${getStatusColor(appointment.status)}`}>
                        {appointment.status === 'scheduled' && 'Agendada'}
                        {appointment.status === 'in-progress' && 'Em andamento'}
                        {appointment.status === 'completed' && 'Concluída'}
                        {appointment.status === 'cancelled' && 'Cancelada'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard__empty-state">
                  <p>Nenhuma consulta agendada para hoje</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Patients */}
          <div className="dashboard__widget">
            <div className="dashboard__widget-header">
              <h3 className="dashboard__widget-title">Pacientes Recentes</h3>
              <Button variant="ghost" size="sm">Ver todos</Button>
            </div>
            <div className="dashboard__widget-content">
              {recentPatients.length > 0 ? (
                <div className="dashboard__patients-list">
                  {recentPatients.map(patient => (
                    <div key={patient.id} className="dashboard__patient-item">
                      <div className="dashboard__patient-avatar">
                        {patient.avatar ? (
                          <img src={patient.avatar} alt="" />
                        ) : (
                          <div className="dashboard__patient-avatar-placeholder">
                            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="dashboard__patient-details">
                        <h4 className="dashboard__patient-name">{patient.name}</h4>
                        <p className="dashboard__patient-info">
                          Última visita: {formatDate(patient.lastVisit)}
                        </p>
                        {patient.nextAppointment && (
                          <p className="dashboard__patient-info">
                            Próxima: {formatDate(patient.nextAppointment)}
                          </p>
                        )}
                      </div>
                      <div className={`dashboard__patient-status ${getStatusColor(patient.status)}`}>
                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard__empty-state">
                  <p>Nenhum paciente recente</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="dashboard__widget">
            <div className="dashboard__widget-header">
              <h3 className="dashboard__widget-title">Tarefas Pendentes</h3>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </div>
            <div className="dashboard__widget-content">
              {pendingTasks.length > 0 ? (
                <div className="dashboard__tasks-list">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="dashboard__task-item">
                      <div className="dashboard__task-checkbox">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {
                            setPendingTasks(tasks => 
                              tasks.map(t => 
                                t.id === task.id ? { ...t, completed: !t.completed } : t
                              )
                            );
                          }}
                          aria-label={`Marcar tarefa "${task.title}" como ${task.completed ? 'pendente' : 'concluída'}`}
                        />
                      </div>
                      <div className="dashboard__task-content">
                        <h4 className={`dashboard__task-title ${task.completed ? 'dashboard__task-title--completed' : ''}`}>
                          {task.title}
                        </h4>
                        <p className="dashboard__task-due-date">
                          Prazo: {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <div className={`dashboard__task-priority ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' && 'Alta'}
                        {task.priority === 'medium' && 'Média'}
                        {task.priority === 'low' && 'Baixa'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard__empty-state">
                  <p>Nenhuma tarefa pendente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard__quick-actions">
          <h3 className="dashboard__quick-actions-title">Ações Rápidas</h3>
          <div className="dashboard__quick-actions-grid">
            <Button 
              variant="outline" 
              className="dashboard__quick-action"
              onClick={() => window.location.href = '/admin/patients'}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Novo Paciente
            </Button>
            
            <Button 
              variant="outline" 
              className="dashboard__quick-action"
              onClick={() => window.location.href = '/admin/appointments'}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Agendar Consulta
            </Button>
            
            <Button 
              variant="outline" 
              className="dashboard__quick-action"
              onClick={() => window.location.href = '/admin/billing'}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Gerar Fatura
            </Button>
            
            <Button 
              variant="outline" 
              className="dashboard__quick-action"
              onClick={() => window.location.href = '/admin/reports'}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Relatórios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;