import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  generateMockUser,
  generateMockPatient,
  generateMockProvider,
  generateMockAppointment,
  generateMockContact,
  generateMockDashboardStats,
  generateMockApiResponse,
  generateMockErrorResponse,
  generateMultiple
} from './mockData';

// Base API URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Mock data stores
let mockUsers: any[] = [];
let mockPatients: any[] = [];
let mockProviders: any[] = [];
let mockAppointments: any[] = [];
let mockContacts: any[] = [];

// Initialize mock data
const initializeMockData = () => {
  mockUsers = generateMultiple(generateMockUser, 5);
  mockPatients = generateMultiple(generateMockPatient, 20);
  mockProviders = generateMultiple(generateMockProvider, 8);
  mockAppointments = generateMultiple(generateMockAppointment, 30);
  mockContacts = generateMultiple(generateMockContact, 15);
};

// Initialize data
initializeMockData();

// API handlers
export const handlers = [
  // Auth - Login
  http.post(`${API_BASE}/api/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    if (email === 'admin@topsmile.com' && password === 'SecurePass123!') {
      const user = mockUsers[0];
      return HttpResponse.json(generateMockApiResponse({
        user,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: '1h'
      }), { status: 200 });
    }
    
    return HttpResponse.json(
      generateMockErrorResponse('E-mail ou senha inválidos', 401),
      { status: 401 }
    );
  }),

  // Auth - Register
  http.post(`${API_BASE}/api/auth/register`, async ({ request }) => {
    const userData = await request.json() as any;
    const newUser = generateMockUser({
      name: userData.name,
      email: userData.email,
      role: 'admin'
    });
    
    mockUsers.push(newUser);
    
    return HttpResponse.json(generateMockApiResponse({
      user: newUser,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: '1h'
    }), { status: 201 });
  }),

  // Auth - Get current user
  http.get(`${API_BASE}/api/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        generateMockErrorResponse('Token não fornecido', 401),
        { status: 401 }
      );
    }
    
    return HttpResponse.json(generateMockApiResponse(mockUsers[0]), { status: 200 });
  }),

  // Auth - Refresh token
  http.post(`${API_BASE}/api/auth/refresh`, async () => {
    return HttpResponse.json(generateMockApiResponse({
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresIn: '1h'
    }), { status: 200 });
  }),

  // Auth - Logout
  http.post(`${API_BASE}/api/auth/logout`, async () => {
    return HttpResponse.json(
      generateMockApiResponse(null, true, 'Logout realizado com sucesso'),
      { status: 200 }
    );
  }),

  // Patients - Get all
  http.get(`${API_BASE}/api/patients`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    
    let filteredPatients = mockPatients;
    
    if (search) {
      filteredPatients = mockPatients.filter(patient => 
        patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
        patient.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return HttpResponse.json(generateMockApiResponse(filteredPatients), { status: 200 });
  }),

  // Patients - Get by ID
  http.get(`${API_BASE}/api/patients/:id`, ({ params }) => {
    const { id } = params;
    const patient = mockPatients.find(p => p._id === id);
    
    if (!patient) {
      return HttpResponse.json(
        generateMockErrorResponse('Paciente não encontrado', 404),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(generateMockApiResponse(patient), { status: 200 });
  }),

  // Patients - Create
  http.post(`${API_BASE}/api/patients`, async ({ request }) => {
    const patientData = await request.json() as any;
    const newPatient = generateMockPatient({
      ...patientData,
      _id: `patient-${Date.now()}`
    });
    
    mockPatients.push(newPatient);
    
    return HttpResponse.json(generateMockApiResponse(newPatient), { status: 201 });
  }),

  // Contacts - Get all
  http.get(`${API_BASE}/api/admin/contacts`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    let filteredContacts = mockContacts;
    
    if (status) {
      filteredContacts = filteredContacts.filter(contact => contact.status === status);
    }
    
    if (search) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return HttpResponse.json(generateMockApiResponse({
      contacts: filteredContacts,
      total: filteredContacts.length,
      page: 1,
      totalPages: 1
    }), { status: 200 });
  }),

  // Contacts - Create
  http.post(`${API_BASE}/api/admin/contacts`, async ({ request }) => {
    const contactData = await request.json() as any;
    const newContact = generateMockContact({
      ...contactData,
      _id: `contact-${Date.now()}`
    });
    
    mockContacts.push(newContact);
    
    return HttpResponse.json(generateMockApiResponse(newContact), { status: 201 });
  }),

  // Dashboard - Get stats
  http.get(`${API_BASE}/api/admin/dashboard`, () => {
    const stats = generateMockDashboardStats();
    return HttpResponse.json(generateMockApiResponse(stats), { status: 200 });
  }),

  // Public contact form
  http.post(`${API_BASE}/api/contact`, async ({ request }) => {
    const contactData = await request.json() as any;
    const newContact = generateMockContact({
      ...contactData,
      _id: `contact-${Date.now()}`,
      status: 'new',
      source: 'website'
    });
    
    mockContacts.push(newContact);
    
    return HttpResponse.json(generateMockApiResponse({
      id: newContact._id,
      protocol: `TOP${Date.now()}`,
      estimatedResponse: '24 horas'
    }), { status: 201 });
  }),

  // Health check
  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json(generateMockApiResponse({
      timestamp: new Date().toISOString(),
      uptime: '2h 30m',
      database: { status: 'connected', name: 'topsmile-test' },
      memory: { used: '45MB', total: '512MB' },
      environment: 'test',
      version: '1.0.0',
      nodeVersion: process.version
    }), { status: 200 });
  }),

  // Catch-all handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      generateMockErrorResponse('Endpoint não encontrado', 404),
      { status: 404 }
    );
  })
];

// Create MSW server
export const server = setupServer(...handlers);

// Helper functions for tests
export const resetMockData = () => {
  initializeMockData();
};

export const getMockData = () => ({
  users: mockUsers,
  patients: mockPatients,
  providers: mockProviders,
  appointments: mockAppointments,
  contacts: mockContacts
});

export const addMockData = (type: string, data: any) => {
  switch (type) {
    case 'users':
      mockUsers.push(data);
      break;
    case 'patients':
      mockPatients.push(data);
      break;
    case 'providers':
      mockProviders.push(data);
      break;
    case 'appointments':
      mockAppointments.push(data);
      break;
    case 'contacts':
      mockContacts.push(data);
      break;
    default:
      console.warn(`Unknown mock data type: ${type}`);
  }
};

export const clearMockData = (type?: string) => {
  if (type) {
    switch (type) {
      case 'users':
        mockUsers = [];
        break;
      case 'patients':
        mockPatients = [];
        break;
      case 'providers':
        mockProviders = [];
        break;
      case 'appointments':
        mockAppointments = [];
        break;
      case 'contacts':
        mockContacts = [];
        break;
      default:
        console.warn(`Unknown mock data type: ${type}`);
    }
  } else {
    initializeMockData();
  }
};
