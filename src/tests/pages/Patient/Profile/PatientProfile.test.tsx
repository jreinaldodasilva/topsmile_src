import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientAuthContext, PatientAuthContextType } from '../../../../contexts/PatientAuthContext';
import PatientProfile from '../../../../pages/Patient/Profile/PatientProfile';
import { apiService } from '../../../../services/apiService';

// Mocks
jest.mock('../../../../services/apiService');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockPatientUser = {
  _id: 'user1',
  patient: {
    _id: 'patient1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123456789',
    birthDate: '1990-01-01',
    medicalHistory: {
      allergies: ['Peanuts'],
    },
  },
  email: 'john.doe@example.com',
  isActive: true,
  emailVerified: true,
};

const renderProfile = (contextValue: Partial<PatientAuthContextType>) => {
  return render(
    <PatientAuthContext.Provider value={{ refreshPatientData: jest.fn(), ...contextValue } as PatientAuthContextType}>
      <MemoryRouter>
        <PatientProfile />
      </MemoryRouter>
    </PatientAuthContext.Provider>
  );
};

describe('PatientProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.patients.update as jest.Mock).mockResolvedValue({ success: true });
  });

  it('redirects to login if not authenticated', async () => {
    renderProfile({ isAuthenticated: false, patientUser: null });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/patient/login'));
  });

  it('loads and displays patient data', async () => {
    renderProfile({ isAuthenticated: true, patientUser: mockPatientUser });
    expect(await screen.findByLabelText('Nome Completo *')).toHaveValue('John Doe');
    expect(await screen.findByLabelText('Telefone *')).toHaveValue('123456789');
  });

  it('switches between tabs', async () => {
    renderProfile({ isAuthenticated: true, patientUser: mockPatientUser });
    await screen.findByLabelText('Nome Completo *');

    fireEvent.click(screen.getByText('Histórico Médico'));
    expect(screen.getByText('Alergias')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Contato de Emergência'));
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
  });

  it('updates personal information', async () => {
    renderProfile({ isAuthenticated: true, patientUser: mockPatientUser });
    await screen.findByLabelText('Nome Completo *');

    fireEvent.change(screen.getByLabelText('Nome Completo *'), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(apiService.patients.update).toHaveBeenCalledWith('patient1', expect.objectContaining({ name: 'Jane Doe' }));
    });
    await waitFor(() => {
      expect(screen.getByText('Perfil atualizado com sucesso!')).toBeInTheDocument();
    });
  });

  it('adds and removes medical history items', async () => {
    renderProfile({ isAuthenticated: true, patientUser: mockPatientUser });
    await screen.findByLabelText('Nome Completo *');

    fireEvent.click(screen.getByText('Histórico Médico'));

    // Add
    const allergyInput = screen.getByPlaceholderText('Adicionar alergia...');
    fireEvent.change(allergyInput, { target: { value: 'Pollen' } });
    fireEvent.click(screen.getAllByText('Adicionar')[0]);

    await waitFor(() => {
        expect(screen.getByText('Pollen')).toBeInTheDocument();
    });

    // Remove
    const removeButton = screen.getAllByText('×')[0];
    fireEvent.click(removeButton);

    await waitFor(() => {
        expect(screen.queryByText('Peanuts')).not.toBeInTheDocument();
    });
  });

  it('shows an error message if update fails', async () => {
    (apiService.patients.update as jest.Mock).mockResolvedValue({ success: false, message: 'Update failed' });
    renderProfile({ isAuthenticated: true, patientUser: mockPatientUser });
    await screen.findByLabelText('Nome Completo *');

    fireEvent.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });
});
