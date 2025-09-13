import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PatientManagement from '../../pages/Admin/PatientManagement';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('PatientManagement', () => {
  const setup = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientManagement />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders patient management title', () => {
    setup();
    expect(screen.getByText(/Gerenciamento de Pacientes/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    setup();
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
  });

  it('renders patient list after loading', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Lista de Pacientes/i)).toBeInTheDocument();
    });
  });

  it('renders add patient button', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Adicionar Paciente/i })).toBeInTheDocument();
    });
  });
});
