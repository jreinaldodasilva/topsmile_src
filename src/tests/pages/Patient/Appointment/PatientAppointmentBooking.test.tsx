import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PatientAuthContext, PatientAuthContextType } from '../../../../contexts/PatientAuthContext';
import PatientAppointmentBooking from '../../../../pages/Patient/Appointment/PatientAppointmentBooking';
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
  patient: {
    _id: 'patient1',
    name: 'John Doe',
    phone: '123456789'
  },
  email: 'john@example.com',
  isActive: true,
  emailVerified: true
};
const mockProviders = [{ _id: 'provider1', name: 'Dr. Smith', specialties: ['General'] }];

const renderBookingForm = (contextValue: Partial<PatientAuthContextType>) => {
  return render(
    <PatientAuthContext.Provider value={contextValue as PatientAuthContextType}>
      <MemoryRouter>
        <PatientAppointmentBooking />
      </MemoryRouter>
    </PatientAuthContext.Provider>
  );
};

describe('PatientAppointmentBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiService.providers.getAll as jest.Mock).mockResolvedValue({ success: true, data: mockProviders });
    // The component uses mock data for appointment types, so no need to mock the API for it
    (apiService.appointments.create as jest.Mock).mockResolvedValue({ success: true });
  });

  it('redirects to login if not authenticated', async () => {
    renderBookingForm({ isAuthenticated: false, patientUser: null });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/patient/login'));
  });

  it('fetches and displays providers and appointment types', async () => {
    renderBookingForm({ isAuthenticated: true, patientUser: mockPatientUser });
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith - General')).toBeInTheDocument();
      expect(screen.getByText(/Check-up - 30min - R\$ 100/)).toBeInTheDocument();
    });
  });

  it('fetches and displays available time slots', async () => {
    renderBookingForm({ isAuthenticated: true, patientUser: mockPatientUser });
    await screen.findByText('Dr. Smith - General');

    fireEvent.change(screen.getByLabelText('Dentista *'), { target: { value: 'provider1' } });
    fireEvent.change(screen.getByLabelText('Data *'), { target: { value: '2025-10-15' } });

    await waitFor(() => expect(screen.getByText('08:00')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('17:30')).toBeInTheDocument());
  });

  it('allows booking an appointment', async () => {
    renderBookingForm({ isAuthenticated: true, patientUser: mockPatientUser });
    await screen.findByText('Dr. Smith - General');

    fireEvent.change(screen.getByLabelText('Dentista *'), { target: { value: 'provider1' } });
    fireEvent.change(screen.getByLabelText('Tipo de Consulta *'), { target: { value: 'type1' } });
    fireEvent.change(screen.getByLabelText('Data *'), { target: { value: '2025-10-15' } });

    await screen.findByText('09:00');
    fireEvent.click(screen.getByText('09:00'));

    fireEvent.click(screen.getByText('Confirmar Agendamento'));

    await waitFor(() => {
      expect(apiService.appointments.create).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/patient/appointments', { state: { message: 'Consulta agendada com sucesso!' } });
    });
  });

  it('shows an error message if booking fails', async () => {
    (apiService.appointments.create as jest.Mock).mockResolvedValue({ success: false, message: 'Booking failed' });
    renderBookingForm({ isAuthenticated: true, patientUser: mockPatientUser });
    await screen.findByText('Dr. Smith - General');

    fireEvent.change(screen.getByLabelText('Dentista *'), { target: { value: 'provider1' } });
    fireEvent.change(screen.getByLabelText('Tipo de Consulta *'), { target: { value: 'type1' } });
    fireEvent.change(screen.getByLabelText('Data *'), { target: { value: '2025-10-15' } });
    await screen.findByText('09:00');
    fireEvent.click(screen.getByText('09:00'));

    fireEvent.click(screen.getByText('Confirmar Agendamento'));

    await screen.findByText('Booking failed');
  });
});
