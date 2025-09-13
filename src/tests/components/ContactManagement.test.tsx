import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ContactManagement from '../../pages/Admin/ContactManagement';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('ContactManagement', () => {
  const setup = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ContactManagement />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders contact management title', () => {
    setup();
    expect(screen.getByText(/Gerenciamento de Contatos/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    setup();
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
  });

  it('renders contact list after loading', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText(/Lista de Contatos/i)).toBeInTheDocument();
    });
  });

  it('renders add contact button', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Adicionar Contato/i })).toBeInTheDocument();
    });
  });
});
