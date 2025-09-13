import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ErrorProvider } from '../../contexts/ErrorContext';
import { PatientAuthProvider } from '../../contexts/PatientAuthContext';

// Custom render function that includes all necessary providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  withAuth?: boolean;
  withPatientAuth?: boolean;
  withError?: boolean;
}

const AllTheProviders = ({ 
  children, 
  withAuth = true, 
  withPatientAuth = false, 
  withError = true 
}: { 
  children: React.ReactNode;
  withAuth?: boolean;
  withPatientAuth?: boolean;
  withError?: boolean;
}) => {
  let component = (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  if (withError) {
    component = (
      <ErrorProvider>
        {component}
      </ErrorProvider>
    );
  }

  if (withAuth) {
    component = (
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  }

  if (withPatientAuth) {
    component = (
      <PatientAuthProvider>
        {component}
      </PatientAuthProvider>
    );
  }

  return component;
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { 
    withAuth = true, 
    withPatientAuth = false, 
    withError = true,
    ...renderOptions 
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders 
      withAuth={withAuth} 
      withPatientAuth={withPatientAuth} 
      withError={withError}
    >
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper function to render with specific router location
const renderWithRouter = (
  ui: ReactElement,
  { route = '/' } = {}
) => {
  window.history.pushState({}, 'Test page', route);
  return customRender(ui);
};

// Helper function to render without any providers (for testing providers themselves)
const renderWithoutProviders = (ui: ReactElement, options?: RenderOptions) => {
  return render(ui, options);
};

// Helper function to create mock user data
export const createMockUser = (overrides = {}) => ({
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  clinic: 'clinic123',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Helper function to create mock patient data
export const createMockPatient = (overrides = {}) => ({
  _id: 'patient123',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '(11) 99999-9999',
  dateOfBirth: '1990-01-01',
  gender: 'male' as const,
  cpf: '123.456.789-00',
  address: {
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567'
  },
  clinic: 'clinic123',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Helper function to create mock appointment data
export const createMockAppointment = (overrides = {}) => ({
  _id: 'appointment123',
  patient: createMockPatient(),
  provider: createMockProvider(),
  appointmentType: createMockAppointmentType(),
  scheduledStart: new Date('2024-02-15T10:00:00Z'),
  scheduledEnd: new Date('2024-02-15T11:00:00Z'),
  status: 'scheduled' as const,
  priority: 'routine' as const,
  notes: 'Regular checkup',
  clinic: 'clinic123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Helper function to create mock provider data
export const createMockProvider = (overrides = {}) => ({
  _id: 'provider123',
  name: 'Dr. Jane Smith',
  email: 'dr.jane@example.com',
  phone: '(11) 88888-8888',
  specialties: ['general_dentistry'],
  license: 'CRO-12345',
  clinic: 'clinic123',
  workingHours: {
    monday: { start: '08:00', end: '17:00', isWorking: true },
    tuesday: { start: '08:00', end: '17:00', isWorking: true },
    wednesday: { start: '08:00', end: '17:00', isWorking: true },
    thursday: { start: '08:00', end: '17:00', isWorking: true },
    friday: { start: '08:00', end: '17:00', isWorking: true },
    saturday: { start: '08:00', end: '12:00', isWorking: false },
    sunday: { start: '08:00', end: '12:00', isWorking: false }
  },
  timeZone: 'America/Sao_Paulo',
  bufferTimeBefore: 15,
  bufferTimeAfter: 15,
  appointmentTypes: ['type123'],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Helper function to create mock appointment type data
export const createMockAppointmentType = (overrides = {}) => ({
  _id: 'type123',
  name: 'Consulta Geral',
  description: 'Consulta odontológica geral',
  duration: 60,
  price: 150,
  color: '#3B82F6',
  category: 'consulta',
  isActive: true,
  clinic: 'clinic123',
  ...overrides
});

// Helper function to create mock contact data
export const createMockContact = (overrides = {}) => ({
  _id: 'contact123',
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '(11) 99999-9999',
  clinic: 'Clínica Odontológica',
  specialty: 'Ortodontia',
  status: 'new' as const,
  source: 'website' as const,
  notes: 'Interested in orthodontic treatment',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Helper function to create mock clinic data
export const createMockClinic = (overrides = {}) => ({
  _id: 'clinic123',
  name: 'Clínica TopSmile',
  email: 'contato@topsmile.com',
  phone: '(11) 3333-3333',
  address: {
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
    country: 'Brasil'
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Helper function to create mock dashboard stats
export const createMockDashboardStats = (overrides = {}) => ({
  totalPatients: 1247,
  todayAppointments: 12,
  monthlyRevenue: 45680,
  satisfaction: 4.8,
  trends: {
    patients: 12,
    appointments: 8,
    revenue: 15,
    satisfaction: 5
  },
  ...overrides
});

// Helper function to create mock API response
export const createMockApiResponse = <T,>(data: T, success = true, message?: string) => ({
  success,
  data,
  message: message || (success ? 'Success' : 'Error')
});

// Helper function to create mock form data
export const createMockFormData = (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  phone: '(11) 99999-9999',
  clinic: 'Test Clinic',
  specialty: 'Ortodontia',
  ...overrides
});

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper function to create mock localStorage
export const createMockLocalStorage = () => {
  let store: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
};

// Helper function to mock window.location
export const mockWindowLocation = (url: string) => {
  const location = new URL(url);
  Object.defineProperty(window, 'location', {
    value: {
      ...location,
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn()
    },
    writable: true
  });
};

// Helper function to create mock file
export const createMockFile = (name = 'test.txt', content = 'test content', type = 'text/plain') => {
  const file = new File([content], name, { type });
  return file;
};

// Helper function to simulate user input
export const simulateUserInput = async (element: HTMLElement, value: string) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.change(element, { target: { value } });
};

// Helper function to simulate form submission
export const simulateFormSubmission = async (form: HTMLFormElement) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.submit(form);
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render, renderWithRouter, renderWithoutProviders };
