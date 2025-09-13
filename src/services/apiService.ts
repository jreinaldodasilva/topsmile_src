// src/services/apiService.ts - Updated for Backend Integration
import { request } from './http';
import type {
  ApiResult,
  Contact,
  ContactFilters,
  ContactListResponse,
  DashboardStats,
  User
} from '../types/api';

export type { ApiResult, Contact, ContactFilters, ContactListResponse, DashboardStats, User };

// ADDED: New types for appointments, forms, patients, and providers
export interface Appointment {
  _id: string;
  patient: string | Patient;
  clinic: string | Clinic;
  provider: string | Provider;
  appointmentType: string | AppointmentType;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
  actualStart?: string | Date;
  actualEnd?: string | Date;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority?: 'routine' | 'urgent' | 'emergency';
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AppointmentType {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  color?: string;
  category?: string;
  isActive: boolean;
  clinic: string | Clinic;
}

export interface Patient {
  _id: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  cpf?: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    notes?: string;
  };
  clinic: string | Clinic;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Provider {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  license?: string;
  clinic: string | Clinic;
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      isWorking: boolean;
    };
  };
  timeZone: string;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  appointmentTypes: string[];
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Clinic {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface FormTemplate {
  _id: string;
  title: string;
  questions: Array<{
    id: string;
    label: string;
    type: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    // Add other question fields as needed
  }>;
}

export interface FormResponse {
  _id: string;
  templateId: string;
  patientId: string;
  answers: { [key: string]: string };
  submittedAt: string;
}


// UPDATED: Authentication methods to match backend endpoints
async function login(email: string, password: string): Promise<ApiResult<{
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}>> {
  const res = await request<{ user: User; accessToken: string; refreshToken: string; expiresIn: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Patient authentication methods
async function patientLogin(email: string, password: string): Promise<ApiResult<{
  patientUser: any;
  accessToken: string;
  refreshToken: string;
}>> {
  const res = await request('/api/patient/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function patientRegister(data: {
  patientId: string;
  email: string;
  password: string;
}): Promise<ApiResult<{
  patientUser: any;
  accessToken?: string;
  refreshToken?: string;
}>> {
  const res = await request('/api/patient/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function patientMe(): Promise<ApiResult<any>> {
  const res = await request('/api/patient/auth/me');
  return { success: res.ok, data: res.data, message: res.message };
}

async function patientRefreshToken(refreshToken: string): Promise<ApiResult<{
  accessToken: string;
  refreshToken: string;
}>> {
  const res = await request('/api/patient/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function patientLogout(): Promise<ApiResult<void>> {
  const res = await request('/api/patient/auth/logout', {
    method: 'POST'
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function patientVerifyEmail(token: string): Promise<ApiResult<void>> {
  const res = await request('/api/patient/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function patientForgotPassword(email: string): Promise<ApiResult<void>> {
  const res = await request('/api/patient/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function patientResetPassword(token: string, password: string): Promise<ApiResult<void>> {
  const res = await request('/api/patient/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function register(payload: {
  name: string;
  email: string;
  password: string;
  clinic?: {
    name: string;
    phone: string;
    address: {
      street: string;
      number?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
}): Promise<ApiResult<{
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}>> {
  const res = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// UPDATED: Get current user info
async function me(): Promise<ApiResult<User>> {
  const res = await request<User>('/api/auth/me');
  return { success: res.ok, data: res.data, message: res.message };
}

// UPDATED: Refresh token endpoint
async function refreshToken(refreshToken: string): Promise<ApiResult<{
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}>> {
  const res = await request('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// UPDATED: Logout with refresh token
async function logout(refreshToken: string): Promise<ApiResult<void>> {
  const res = await request('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// UPDATED: Contact management - now uses admin endpoints
async function getContacts(query?: Record<string, any>): Promise<ApiResult<ContactListResponse>> {
  const qs = query
    ? '?' + Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const res = await request<ContactListResponse>(`/api/admin/contacts${qs}`);
  return { success: res.ok, data: res.data, message: res.message };
}

async function getContact(id: string): Promise<ApiResult<Contact>> {
  const res = await request<Contact>(`/api/admin/contacts/${encodeURIComponent(id)}`);
  return { success: res.ok, data: res.data, message: res.message };
}

async function createContact(payload: Partial<Contact>): Promise<ApiResult<Contact>> {
  const res = await request('/api/admin/contacts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function updateContact(id: string, payload: Partial<Contact>): Promise<ApiResult<Contact>> {
  const res = await request(`/api/admin/contacts/${encodeURIComponent(id)}`, {
    method: 'PATCH', // Backend uses PATCH, not PUT
    body: JSON.stringify(payload)
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function deleteContact(id: string): Promise<ApiResult<void>> {
  const res = await request(`/api/admin/contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// UPDATED: Dashboard stats endpoint
async function getDashboardStats(): Promise<ApiResult<DashboardStats>> {
  const res = await request<DashboardStats>('/api/admin/dashboard');
  return { success: res.ok, data: res.data, message: res.message };
}

// UPDATED: Contact stats endpoint
async function getContactStats(): Promise<ApiResult<{
  total: number;
  byStatus: Array<{ _id: string; count: number }>;
  bySource: Array<{ _id: string; count: number }>;
  recentCount: number;
  monthlyTrend: Array<{ month: string; count: number }>;
}>> {
  const res = await request('/api/admin/contacts/stats');
  return { success: res.ok, data: res.data, message: res.message };
}

// UPDATED: Public contact form - matches backend validation
async function sendContactForm(payload: {
  name: string;
  email: string;
  clinic: string;
  specialty: string;
  phone: string;
}): Promise<ApiResult<{
  id: string;
  protocol: string;
  estimatedResponse: string;
}>> {
  const res = await request('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Batch contact operations
async function batchUpdateContacts(
  contactIds: string[],
  updates: { status?: string; assignedTo?: string }
): Promise<ApiResult<{ modifiedCount: number; matchedCount: number }>> {
  const res = await request('/api/admin/contacts/batch', {
    method: 'PATCH',
    body: JSON.stringify({ contactIds, updates })
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Find duplicate contacts
async function findDuplicateContacts(): Promise<ApiResult<Array<{
  email: string;
  contacts: Contact[];
  count: number;
}>>> {
  const res = await request('/api/admin/contacts/duplicates');
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Merge duplicate contacts
async function mergeDuplicateContacts(
  primaryContactId: string,
  duplicateContactIds: string[]
): Promise<ApiResult<Contact>> {
  const res = await request('/api/admin/contacts/merge', {
    method: 'POST',
    body: JSON.stringify({ primaryContactId, duplicateContactIds })
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Appointments API methods
async function getAppointments(query?: Record<string, any>): Promise<ApiResult<Appointment[]>> {
  const qs = query
    ? '?' + Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const res = await request<Appointment[]>(`/api/appointments${qs}`);
  return { success: res.ok, data: res.data, message: res.message };
}

async function getAppointment(id: string): Promise<ApiResult<Appointment>> {
  const res = await request<Appointment>(`/api/appointments/${encodeURIComponent(id)}`);
  return { success: res.ok, data: res.data, message: res.message };
}

async function createAppointment(payload: Partial<Appointment>): Promise<ApiResult<Appointment>> {
  // Map frontend fields to backend fields
  const backendPayload = {
    patient: typeof payload.patient === 'string' ? payload.patient : payload.patient?._id,
    provider: typeof payload.provider === 'string' ? payload.provider : payload.provider?._id,
    appointmentType: typeof payload.appointmentType === 'string' ? payload.appointmentType : payload.appointmentType?._id,
    scheduledStart: payload.scheduledStart,
    scheduledEnd: payload.scheduledEnd,
    status: payload.status,
    priority: payload.priority,
    notes: payload.notes
  };
  
  const res = await request('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(backendPayload)
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function updateAppointment(id: string, payload: Partial<Appointment>): Promise<ApiResult<Appointment>> {
  // Map frontend fields to backend fields
  const backendPayload = {
    patient: typeof payload.patient === 'string' ? payload.patient : payload.patient?._id,
    provider: typeof payload.provider === 'string' ? payload.provider : payload.provider?._id,
    appointmentType: typeof payload.appointmentType === 'string' ? payload.appointmentType : payload.appointmentType?._id,
    scheduledStart: payload.scheduledStart,
    scheduledEnd: payload.scheduledEnd,
    status: payload.status,
    priority: payload.priority,
    notes: payload.notes
  };
  
  const res = await request(`/api/appointments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(backendPayload)
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function deleteAppointment(id: string): Promise<ApiResult<void>> {
  const res = await request(`/api/appointments/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Form Templates API methods
async function getFormTemplates(): Promise<ApiResult<FormTemplate[]>> {
  const res = await request<FormTemplate[]>('/api/forms/templates');
  return { success: res.ok, data: res.data, message: res.message };
}

async function getFormTemplate(id: string): Promise<ApiResult<FormTemplate>> {
  const res = await request<FormTemplate>(`/api/forms/templates/${encodeURIComponent(id)}`);
  return { success: res.ok, data: res.data, message: res.message };
}

async function createFormTemplate(payload: Partial<FormTemplate>): Promise<ApiResult<FormTemplate>> {
  const res = await request('/api/forms/templates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function updateFormTemplate(id: string, payload: Partial<FormTemplate>): Promise<ApiResult<FormTemplate>> {
  const res = await request(`/api/forms/templates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return { success: res.ok, data: res.data, message: res.message };
}

async function deleteFormTemplate(id: string): Promise<ApiResult<void>> {
  const res = await request(`/api/forms/templates/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Form Responses API methods
async function getFormResponses(query?: Record<string, any>): Promise<ApiResult<FormResponse[]>> {
  const qs = query
    ? '?' + Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const res = await request<FormResponse[]>(`/api/forms/responses${qs}`);
  return { success: res.ok, data: res.data, message: res.message };
}

async function createFormResponse(payload: {
  templateId: string;
  patientId: string;
  answers: { [key: string]: string };
}): Promise<ApiResult<FormResponse>> {
  const res = await request('/api/forms/responses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Patients API methods
async function getPatients(query: Record<string, any> = {}): Promise<ApiResult<{ patients: Patient[]; total: number; page: number; totalPages: number; hasNext: boolean; hasPrev: boolean; } | Patient[]>> {
    const qs = Object.keys(query).length
        ? `?${new URLSearchParams(query as any).toString()}`
        : '';
    const res = await request(`/api/patients${qs}`);
    return { success: res.ok, data: res.data, message: res.message };
}

async function getPatient(id: string): Promise<ApiResult<Patient>> {
    const res = await request<Patient>(`/api/patients/${encodeURIComponent(id)}`);
    return { success: res.ok, data: res.data, message: res.message };
}

async function createPatient(payload: Partial<Patient>): Promise<ApiResult<Patient>> {
    // Map frontend fields to backend fields
    const backendPayload = {
        name: payload.firstName ? `${payload.firstName} ${payload.lastName || ''}`.trim() : payload.fullName,
        email: payload.email,
        phone: payload.phone,
        birthDate: payload.dateOfBirth,
        gender: payload.gender === 'prefer_not_to_say' ? undefined : payload.gender,
        cpf: payload.cpf,
        address: payload.address,
        emergencyContact: payload.emergencyContact,
        medicalHistory: payload.medicalHistory
    };
    
    const res = await request<Patient>(`/api/patients`, {
        method: 'POST',
        body: JSON.stringify(backendPayload),
    });
    return { success: res.ok, data: res.data, message: res.message };
}

async function updatePatient(id: string, payload: Partial<Patient>): Promise<ApiResult<Patient>> {
    // Map frontend fields to backend fields
    const backendPayload = {
        name: payload.firstName ? `${payload.firstName} ${payload.lastName || ''}`.trim() : payload.fullName,
        email: payload.email,
        phone: payload.phone,
        birthDate: payload.dateOfBirth,
        gender: payload.gender === 'prefer_not_to_say' ? undefined : payload.gender,
        cpf: payload.cpf,
        address: payload.address,
        emergencyContact: payload.emergencyContact,
        medicalHistory: payload.medicalHistory
    };
    
    const res = await request<Patient>(`/api/patients/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(backendPayload),
    });
    return { success: res.ok, data: res.data, message: res.message };
}

async function deletePatient(id: string): Promise<ApiResult<void>> {
    const res = await request<void>(`/api/patients/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { success: res.ok, data: res.data, message: res.message };
}

// ADDED: Providers API methods
async function getProviders(query: Record<string, any> = {}): Promise<ApiResult<Provider[]>> {
    const qs = Object.keys(query).length
        ? `?${new URLSearchParams(query as any).toString()}`
        : '';
    const res = await request<Provider[]>(`/api/providers${qs}`);
    return { success: res.ok, data: res.data, message: res.message };
}

async function getProvider(id: string): Promise<ApiResult<Provider>> {
    const res = await request<Provider>(`/api/providers/${encodeURIComponent(id)}`);
    return { success: res.ok, data: res.data, message: res.message };
}

async function createProvider(payload: Partial<Provider>): Promise<ApiResult<Provider>> {
    const res = await request<Provider>(`/api/providers`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return { success: res.ok, data: res.data, message: res.message };
}

async function updateProvider(id: string, payload: Partial<Provider>): Promise<ApiResult<Provider>> {
    const res = await request<Provider>(`/api/providers/${encodeURIComponent(id)}`, {
        method: 'PATCH', // Using PATCH for consistency
        body: JSON.stringify(payload),
    });
    return { success: res.ok, data: res.data, message: res.message };
}

async function deleteProvider(id: string): Promise<ApiResult<void>> {
    const res = await request<void>(`/api/providers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { success: res.ok, data: res.data, message: res.message };
}


// ADDED: Health check endpoints
async function getHealthStatus(): Promise<ApiResult<{
  timestamp: string;
  uptime: string;
  database: { status: string; name: string };
  memory: { used: string; total: string };
  environment: string;
  version: string;
  nodeVersion: string;
}>> {
  const res = await request('/api/health', { auth: false });
  return { success: res.ok, data: res.data, message: res.message };
}

/**
 * Main API service object with nested structure
 */
export const apiService = {
  auth: {
    login,
    register,
    me,
    refreshToken,
    logout
  },
  patientAuth: {
    login: patientLogin,
    register: patientRegister,
    me: patientMe,
    refreshToken: patientRefreshToken,
    logout: patientLogout,
    verifyEmail: patientVerifyEmail,
    forgotPassword: patientForgotPassword,
    resetPassword: patientResetPassword
  },
  contacts: {
    getAll: getContacts,
    getOne: getContact,
    create: createContact,
    update: updateContact,
    delete: deleteContact,
    getStats: getContactStats,
    batchUpdate: batchUpdateContacts,
    findDuplicates: findDuplicateContacts,
    mergeDuplicates: mergeDuplicateContacts
  },
  appointments: {
    getAll: getAppointments,
    getOne: getAppointment,
    create: createAppointment,
    update: updateAppointment,
    delete: deleteAppointment
  },
  forms: {
    templates: {
      getAll: getFormTemplates,
      getOne: getFormTemplate,
      create: createFormTemplate,
      update: updateFormTemplate,
      delete: deleteFormTemplate
    },
    responses: {
      getAll: getFormResponses,
      create: createFormResponse
    }
  },
  patients: {
      getAll: getPatients,
      getOne: getPatient,
      create: createPatient,
      update: updatePatient,
      delete: deletePatient,
  },
  providers: {
      getAll: getProviders,
      getOne: getProvider,
      create: createProvider,
      update: updateProvider,
      delete: deleteProvider,
  },
  dashboard: {
    getStats: getDashboardStats
  },
  public: {
    sendContactForm
  },
  system: {
    health: getHealthStatus
  },

  // Flat exports for backward compatibility
  login,
  register,
  me,
  refreshToken,
  logout,
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getDashboardStats,
  getContactStats,
  sendContactForm,
  batchUpdateContacts,
  findDuplicateContacts,
  mergeDuplicateContacts,
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getFormTemplates,
  getFormTemplate,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  getFormResponses,
  createFormResponse,
  getHealthStatus,
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getProviders,
  getProvider,
  createProvider,
  updateProvider,
  deleteProvider
};

export default apiService;
