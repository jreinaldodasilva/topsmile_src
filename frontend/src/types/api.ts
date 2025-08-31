// frontend/src/services/api.ts
export type ApiResult<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type Pagination = {
  page?: number;
  pageSize?: number;
  total?: number;
  pages?: number;
};

export type User = {
  id?: string; // backend toJSON maps _id -> id
  _id?: string;
  name?: string;
  email?: string;
  role?: 'super_admin' | 'admin' | 'manager' | 'dentist' | 'assistant';
  clinic?: string | Clinic;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
};

// Contact aligned with backend IContact
export type Contact = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  clinic: string;
  specialty: string;
  phone: string;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source?: string;
  notes?: string;
  assignedTo?: string | User;
  followUpDate?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
};

export type ContactFilters = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  [key: string]: any;
};

export type ContactListResponse = Pagination & {
  contacts: Contact[];
};

// Appointment model (typical fields)
export type Appointment = {
  id?: string;
  _id?: string;
  patient?: string | Patient;
  contact?: string | Contact;
  clinic?: string | Clinic;
  provider?: string | User;
  scheduledAt: string | Date;
  durationMinutes?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
};

// Clinic model
export type Clinic = {
  id?: string;
  _id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
};

// Patient model
export type Patient = {
  id?: string;
  _id?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dob?: string | Date;
  gender?: 'male' | 'female' | 'other' | string;
  clinic?: string | Clinic;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
};

// Form field and template models
export type FormField = {
  name: string;
  label?: string;
  type?: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: { [key: string]: any };
  [key: string]: any;
};

export type FormTemplate = {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  fields: FormField[];
  isActive?: boolean;
  createdBy?: string | User;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
};

export type DashboardStats = {
  totalContacts: number;
  newThisMonth: number;
  contactsByStatus?: { [status: string]: number };
  [key: string]: number | { [key: string]: number } | undefined;
};
