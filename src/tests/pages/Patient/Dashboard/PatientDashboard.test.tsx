import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientAuthContext, PatientAuthContextType } from '../../../../contexts/PatientAuthContext';
import PatientDashboard from '../../../../pages/Patient/Dashboard/PatientDashboard';
import { apiService } from '../../../../services/apiService';

// Mocks
jest.mock('../../../../../services/apiService');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockPatientUser = {
  _id: 'user1',
  patient: { _id: 'patient1', name: 'John Doe', phone: '123456789' },
  email: 'john@example.com',
  isActive: true,
  emailVerified: true
};

const mockAppointments = [
  {
    _id: 'appt1',
    scheduledStart: '2023-10-27T10:00:00.000Z',
    scheduledEnd: '2023-10-27T11:00:00.000Z',
    status: 'confirmed',
    appointmentType: { name: 'Check-up' },
    provider: { name: 'Dr. Smith' },
    clinic: { name: 'Smile Clinic' }
  }
];

const renderDashboard = (contextValue: Partial<PatientAuthContextType>) => {
  return render(
    <PatientAuthContext.Provider value={contextValue as PatientAuthContextType}>
      <MemoryRouter>
        <PatientDashboard />
      </MemoryRouter>
    </PatientAuthContext.Provider>
  );
};

describe('PatientDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.appointments.getAll as jest.Mock).mockResolvedValue({ success: true, data: mockAppointments });
  });

  it('redirects to login if not authenticated', async () => {
    renderDashboard({ isAuthenticated: false });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/patient/login'));
  });

  it('loads and displays dashboard data', async () => {
    renderDashboard({ isAuthenticated: true, patientUser: mockPatientUser });
    await waitFor(() => {
      expect(screen.getByText('Olá, John!')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Check-up')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderDashboard({ isAuthenticated: true, patientUser: mockPatientUser });
    expect(screen.getByText('Carregando agendamentos...')).toBeInTheDocument();
  });

  it('shows error message if loading fails', async () => {
    (apiService.appointments.getAll as jest.Mock).mockResolvedValue({ success: false, message: 'Failed to load' });
    renderDashboard({ isAuthenticated: true, patientUser: mockPatientUser });
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar agendamentos')).toBeInTheDocument();
    });
  });
});
