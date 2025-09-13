import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../../components/Admin/Dashboard/Dashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('AdminDashboard', () => {
  const setup = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders dashboard title', () => {
    setup();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    setup();
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
  });

  it('renders stats cards after loading', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Total de Pacientes/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Consultas Hoje/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Receita Mensal/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Satisfação/i)).toBeInTheDocument();
    });
  });

  it('renders upcoming appointments section', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Próximas Consultas/i)).toBeInTheDocument();
    });
  });

  it('renders recent patients section', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Pacientes Recentes/i)).toBeInTheDocument();
    });
  });

  it('renders pending tasks section', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Tarefas Pendentes/i)).toBeInTheDocument();
    });
  });

  it('renders quick actions section', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Ações Rápidas/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Novo Paciente/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Agendar Consulta/i)).toBeInTheDocument();
    });
  });
});
