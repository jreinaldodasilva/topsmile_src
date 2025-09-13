import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProviderManagement from '../../pages/Admin/ProviderManagement';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('ProviderManagement', () => {
  const setup = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProviderManagement />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders provider management title', () => {
    setup();
    expect(screen.getByText(/Gerenciamento de Fornecedores/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    setup();
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
  });

  it('renders provider list after loading', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Lista de Fornecedores/i)).toBeInTheDocument();
    });
  });

  it('renders add provider button', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Adicionar Fornecedor/i })).toBeInTheDocument();
    });
  });
});
