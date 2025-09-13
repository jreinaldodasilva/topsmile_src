import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientAuthContext, PatientAuthContextType } from '../../../../contexts/PatientAuthContext';
import PatientAppointmentsList from '../../../../pages/Patient/Appointment/PatientAppointmentsList';
import { apiService } from '../../../../services/apiService';

// Mocks
jest.mock('../../../../../services/apiService');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockAppointments = [
  { _id: 'appt1', scheduledStart: '2023-10-27T10:00:00.000Z', status: 'Confirmed', provider: { name: 'Dr. Smith' }, appointmentType: { name: 'Check-up' } },
  { _id: 'appt2', scheduledStart: '2023-11-15T14:00:00.000Z', status: 'Completed', provider: { name: 'Dr. Jones' }, appointmentType: { name: 'Cleaning' } },
];

const renderList = (contextValue: Partial<PatientAuthContextType>) => {
  return render(
    <PatientAuthContext.Provider value={contextValue as PatientAuthContextType}>
      <MemoryRouter>
        <PatientAppointmentsList />
      </MemoryRouter>
    </PatientAuthContext.Provider>
  );
};

describe('PatientAppointmentsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.appointments.getAll as jest.Mock).mockResolvedValue({ success: true, data: mockAppointments });
  });

  it('redirects to login if not authenticated', async () => {
    renderList({ isAuthenticated: false });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/patient/login'));
  });

  it('loads and displays appointments', async () => {
    renderList({ isAuthenticated: true, patientUser: { _id: 'user1', patient: { _id: 'patient1', name: 'John Doe', phone: '123456789' }, email: 'john@example.com', isActive: true, emailVerified: true } });
    await waitFor(() => {
      expect(screen.getByText('Check-up with Dr. Smith')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Cleaning with Dr. Jones')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderList({ isAuthenticated: true, patientUser: { _id: 'user1', patient: { _id: 'patient1', name: 'John Doe', phone: '123456789' }, email: 'john@example.com', isActive: true, emailVerified: true } });
    expect(screen.getByText('Loading appointments.')).toBeInTheDocument();
  });

  it('shows error message if loading fails', async () => {
    (apiService.appointments.getAll as jest.Mock).mockResolvedValue({ success: false, message: 'Failed to load' });
    renderList({ isAuthenticated: true, patientUser: { _id: 'user1', patient: { _id: 'patient1', name: 'John Doe', phone: '123456789' }, email: 'john@example.com', isActive: true, emailVerified: true } });
    await waitFor(() => {
      expect(screen.getByText('Failed to load appointments.')).toBeInTheDocument();
    });
  });

  it('navigates to appointment detail on click', async () => {
    renderList({ isAuthenticated: true, patientUser: { _id: 'user1', patient: { _id: 'patient1', name: 'John Doe', phone: '123456789' }, email: 'john@example.com', isActive: true, emailVerified: true } });
    await waitFor(() => {
      expect(screen.getByText('Check-up with Dr. Smith')).toBeInTheDocument();
    });
    const appointmentLink = screen.getByText('Check-up with Dr. Smith');
    fireEvent.click(appointmentLink);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/patient/appointments/appt1');
    });
  });
});
