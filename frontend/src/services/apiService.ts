// src/services/apiService.ts
import { request } from './http';
import type { ApiResult, Contact, ContactFilters, ContactListResponse, DashboardStats, User } from '../types/api';

export type { ApiResult, Contact, ContactFilters, ContactListResponse, DashboardStats, User };

async function login(email: string, password: string): Promise<ApiResult<{ token: string }>> {
  const res = await request<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }, false);
  return { success: true, data: res.data, message: res.message };
}

async function register(payload: { name: string; email: string; password: string }): Promise<ApiResult> {
  const res = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, false);
  return { success: true, data: res.data, message: res.message } as ApiResult;
}

async function me(): Promise<ApiResult<User>> {
  const res = await request('/api/admin/auth/me');
  return { success: true, data: res.data, message: res.message } as ApiResult<User>;
}

async function getContacts(query?: Record<string, any>): Promise<ApiResult<Contact[] | ContactListResponse>> {
  const qs = query
    ? '?' +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  // changed endpoint to backend admin route
  const res = await request<Contact[] | ContactListResponse>(`/api/admin/contacts${qs}`, { method: 'GET' });
  return { success: true, data: res.data, message: res.message } as ApiResult<Contact[] | ContactListResponse>;
}

async function getContact(id: string): Promise<ApiResult<Contact>> {
  // changed endpoint to backend admin route
  const res = await request<Contact>(`/api/admin/contacts/${encodeURIComponent(id)}`, { method: 'GET' });
  return { success: true, data: res.data, message: res.message } as ApiResult<Contact>;
}

async function createContact(payload: Partial<Contact>): Promise<ApiResult<Contact>> {
  const res = await request('/api/admin/contacts', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return { success: true, data: res.data, message: res.message } as ApiResult<Contact>;
}

async function updateContact(id: string, payload: Partial<Contact>): Promise<ApiResult<Contact>> {
  const res = await request(`/api/admin/contacts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return { success: true, data: res.data, message: res.message } as ApiResult<Contact>;
}

async function deleteContact(id: string): Promise<ApiResult<void>> {
  const res = await request(`/api/admin/contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return { success: true, data: res.data, message: res.message } as ApiResult<void>;
}

async function getDashboardStats(): Promise<ApiResult<DashboardStats>> {
  // changed endpoint to backend admin dashboard route
  const res = await request<DashboardStats>('/api/admin/dashboard', { method: 'GET' });
  return { success: true, data: res.data, message: res.message } as ApiResult<DashboardStats>;
}

async function sendContactForm(payload: { name: string; email: string; message: string }): Promise<ApiResult> {
  const res = await request('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, false);
  return { success: true, data: res.data, message: res.message } as ApiResult;
}

/**
 * Expose both a nested `apiService` object (for existing callers expecting .contacts/.dashboard)
 * and a default flat instance for backward compatibility.
 */
export const apiService = {
  auth: { login, register, me },
  contacts: {
    getAll: getContacts,
    getOne: getContact,
    create: createContact,
    update: updateContact,
    delete: deleteContact
  },
  dashboard: { getStats: getDashboardStats },
  public: { sendContactForm },

  // flat exports for compatibility
  login,
  register,
  me,
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getDashboardStats,
  sendContactForm
};

export default apiService;