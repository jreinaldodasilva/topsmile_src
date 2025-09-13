import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PatientAuthContext, PatientAuthContextType } from '../../../../contexts/PatientAuthContext';
import PatientAppointmentDetail from '../../../../pages/Patient/Appointment/PatientAppointmentDetail';
import { apiService } from '../../../../services/apiService';

// Mocks
jest.mock('../../../../../services/apiService');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ appointmentId: 'appt1' }),
}));

const mockAppointment = {
  _id: 'appt1',
  scheduledStart: '2023-10-27T10:00:00.000Z',
  status: 'Confirmed',
  provider: { name: 'Dr. Smith' },
  appointmentType: { name: 'Check-up' },
  notes: 'Annual check-up',
};

const renderDetail = (contextValue: Partial<PatientAuthContextType>) => {
  return render(
    <PatientAuthContext.Provider value={contextValue as PatientAuthContextType}>
      <MemoryRouter initialEntries={['/patient/appointments/appt1']}>
        <Routes>
          <Route path="/patient/appointments/:appointmentId" element={<PatientAppointmentDetail />} />
        </Routes>
      </MemoryRouter>
    </PatientAuthContext.Provider>
  );
};

describe('PatientAppointmentDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.appointments.getOne as jest.Mock).mockResolvedValue({ success: true, data: mockAppointment });
  });

  it('redirects to login if not authenticated', async () => {
    renderDetail({ isAuthenticated: false });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/patient/login'));
  });

  it('loads and displays appointment details', async () => {
    renderDetail({ isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText('Check-up with Dr. Smith')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Annual check-up')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderDetail({ isAuthenticated: true });
    expect(screen.getByText('Loading appointment details...')).toBeInTheDocument();
  });

  it('shows error message if loading fails', async () => {
    (apiService.appointments.getOne as jest.Mock).mockResolvedValue({ success: false, message: 'Failed to load' });
    renderDetail({ isAuthenticated: true });
    await waitFor(() => {
      expect(screen.getByText('Failed to load appointment details.')).toBeInTheDocument();
    });
  });
});
