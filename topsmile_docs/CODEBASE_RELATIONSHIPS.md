# TopSmile Codebase Relationships Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema & Relationships](#database-schema--relationships)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [API Relationships](#api-relationships)
7. [Authentication Flow](#authentication-flow)
8. [Business Logic Flow](#business-logic-flow)
9. [Component Relationships](#component-relationships)
10. [Data Flow](#data-flow)
11. [File Structure & Dependencies](#file-structure--dependencies)
12. [Testing Structure](#testing-structure)
13. [Configuration & Environment](#configuration--environment)

## Project Overview

**TopSmile** is a comprehensive Clinical Management System for dental clinics, built as a full-stack web application with:

- **Frontend**: React/TypeScript SPA with modern UI components
- **Backend**: Express.js/TypeScript API with MongoDB
- **Architecture**: MVC pattern with service layer
- **Authentication**: JWT with refresh tokens
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Jest for unit/integration tests
- **Documentation**: Swagger API docs

## Architecture Overview

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   Frontend      │◄──────────────►│   Backend API   │
│   (React)       │                │   (Express)     │
└─────────────────┘                └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐    MongoDB     ┌─────────────────┐
│   Browser       │◄──────────────►│   Database      │
│   Storage       │                │   (MongoDB)     │
└─────────────────┘                └─────────────────┘
```

### Key Architectural Patterns
- **Separation of Concerns**: Clear separation between frontend, backend, and database
- **Service Layer**: Business logic encapsulated in service classes
- **Repository Pattern**: Data access through Mongoose models
- **Middleware Pattern**: Express middleware for authentication, validation, etc.
- **Component Composition**: React components with clear hierarchies

## Database Schema & Relationships

### Core Models & Relationships

```
┌─────────────┐     ┌─────────────┐
│   Clinic    │────►│    User     │
└─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  Provider   │     │RefreshToken │
└─────────────┘     └─────────────┘
       │
       │
       ▼
┌─────────────┐     ┌─────────────┐
│Appointment  │◄────┤  Patient    │
│   Type      │     └─────────────┘
└─────────────┘            │
                           │
                           ▼
                    ┌─────────────┐
                    │ Appointment │
                    └─────────────┘
                           │
                           │
                           ▼
                    ┌─────────────┐
                    │   Contact   │
                    └─────────────┘
```

### Detailed Model Relationships

#### 1. User Model
```typescript
interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'manager' | 'dentist' | 'assistant';
  clinic?: ObjectId; // References Clinic
  isActive: boolean;
  lastLogin?: Date;
}
```
**Relationships:**
- `clinic` → `Clinic._id` (Many-to-One)
- Referenced by: `Provider.user`, `Appointment.createdBy`, `Contact.assignedTo`

#### 2. Clinic Model
```typescript
interface IClinic {
  name: string;
  email: string;
  phone: string;
  address: Address;
  cnpj?: string;
  subscription: Subscription;
  settings: ClinicSettings;
}
```
**Relationships:**
- Referenced by: `User.clinic`, `Provider.clinic`, `Patient.clinic`, `Appointment.clinic`, `AppointmentType.clinic`, `Contact.assignedToClinic`

#### 3. Provider Model
```typescript
interface IProvider {
  clinic: ObjectId; // References Clinic
  user?: ObjectId; // References User
  name: string;
  specialties: string[];
  workingHours: WorkingHours;
  appointmentTypes: ObjectId[]; // References AppointmentType
}
```
**Relationships:**
- `clinic` → `Clinic._id` (Many-to-One)
- `user` → `User._id` (Many-to-One, optional)
- `appointmentTypes` → `AppointmentType._id` (Many-to-Many)
- Referenced by: `Appointment.provider`

#### 4. Patient Model
```typescript
interface IPatient {
  name: string;
  email?: string;
  phone: string;
  clinic: ObjectId; // References Clinic
  medicalHistory: MedicalHistory;
  emergencyContact?: EmergencyContact;
}
```
**Relationships:**
- `clinic` → `Clinic._id` (Many-to-One)
- Referenced by: `Appointment.patient`

#### 5. AppointmentType Model
```typescript
interface IAppointmentType {
  clinic: ObjectId; // References Clinic
  name: string;
  duration: number;
  price?: number;
  category: 'consultation' | 'cleaning' | 'treatment' | 'surgery' | 'emergency';
}
```
**Relationships:**
- `clinic` → `Clinic._id` (Many-to-One)
- Referenced by: `Provider.appointmentTypes`, `Appointment.appointmentType`

#### 6. Appointment Model
```typescript
interface IAppointment {
  patient: ObjectId; // References Patient
  clinic: ObjectId; // References Clinic
  provider: ObjectId; // References Provider
  appointmentType: ObjectId; // References AppointmentType
  scheduledStart: Date;
  scheduledEnd: Date;
  status: AppointmentStatus;
  createdBy: ObjectId; // References User
}
```
**Relationships:**
- `patient` → `Patient._id` (Many-to-One)
- `clinic` → `Clinic._id` (Many-to-One)
- `provider` → `Provider._id` (Many-to-One)
- `appointmentType` → `AppointmentType._id` (Many-to-One)
- `createdBy` → `User._id` (Many-to-One)

#### 7. Contact Model
```typescript
interface IContact {
  name: string;
  email: string;
  clinic: string; // Clinic name as string
  specialty: string;
  status: ContactStatus;
  assignedTo?: ObjectId; // References User
  assignedToClinic?: ObjectId; // References Clinic
}
```
**Relationships:**
- `assignedTo` → `User._id` (Many-to-One, optional)
- `assignedToClinic` → `Clinic._id` (Many-to-One, optional)

#### 8. RefreshToken Model
```typescript
interface IRefreshToken {
  token: string;
  userId: ObjectId; // References User
  expiresAt: Date;
  isRevoked: boolean;
  deviceInfo?: DeviceInfo;
}
```
**Relationships:**
- `userId` → `User._id` (Many-to-One)

## Backend Architecture

### Service Layer Architecture

```
┌─────────────────┐
│   Routes        │
│   (Express)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Controllers    │
│  (Route Handlers│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Services      │
│  (Business      │
│    Logic)       │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Models        │
│  (Mongoose)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│   (MongoDB)     │
└─────────────────┘
```

### Key Backend Components

#### 1. Routes (`/backend/src/routes/`)
- `auth.ts` - Authentication endpoints
- `patients.ts` - Patient management
- `providers.ts` - Provider management
- `appointments.ts` - Appointment scheduling
- `appointmentTypes.ts` - Service type management
- `calendar.ts` - Calendar integration
- `forms.ts` - Dynamic forms
- `docs.ts` - API documentation

#### 2. Services (`/backend/src/services/`)
- `authService.ts` - Authentication & authorization
- `patientService.ts` - Patient CRUD operations
- `providerService.ts` - Provider management
- `contactService.ts` - Contact/lead management
- `schedulingService.ts` - Appointment scheduling logic
- `availabilityService.ts` - Provider availability calculation
- `appointmentTypeService.ts` - Service type management

#### 3. Models (`/backend/src/models/`)
- `User.ts` - User authentication & roles
- `Clinic.ts` - Clinic information & settings
- `Patient.ts` - Patient records (future feature)
- `Provider.ts` - Healthcare providers
- `Appointment.ts` - Appointment scheduling
- `AppointmentType.ts` - Service definitions
- `Contact.ts` - Lead/contact management
- `RefreshToken.ts` - JWT refresh tokens

#### 4. Middleware (`/backend/src/middleware/`)
- `auth.ts` - JWT authentication
- `roleBasedAccess.ts` - Role-based permissions
- `database.ts` - Database connection checks

#### 5. Configuration (`/backend/src/config/`)
- `database.ts` - MongoDB connection
- `swagger.ts` - API documentation setup

### Service Dependencies

```typescript
// authService.ts dependencies
import { User } from '../models/User';
import { Clinic } from '../models/Clinic';
import { RefreshToken } from '../models/RefreshToken';

// schedulingService.ts dependencies
import { Appointment } from '../models/Appointment';
import { Provider } from '../models/Provider';
import { AppointmentType } from '../models/AppointmentType';

// contactService.ts dependencies
import { Contact } from '../models/Contact';
```

## Frontend Architecture

### Component Hierarchy

```
┌─────────────────┐
│     App.tsx     │
│   (Root Component)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Router        │
│   (React Router)│
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌─────────┐ ┌─────────┐
│Protected│ │ Public  │
│ Routes  │ │ Routes  │
└─────────┘ └─────────┘
    │
    ▼
┌─────────────────┐
│   AuthContext   │
│ (Global State)  │
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌─────────┐ ┌─────────┐
│  Pages   │ │Components│
└─────────┘ └─────────┘
```

### Key Frontend Components

#### 1. Pages (`/src/pages/`)
- `Home/Home.tsx` - Landing page
- `Login/RegisterPage.tsx` - Authentication
- `Admin/` - Admin dashboard pages
  - `Dashboard.tsx` - Main dashboard
  - `PatientManagement.tsx` - Patient CRUD
  - `ProviderManagement.tsx` - Provider CRUD
  - `AppointmentCalendar.tsx` - Calendar view
  - `ContactManagement.tsx` - Contact management

#### 2. Components (`/src/components/`)
- `Auth/LoginForm/` - Login components
- `Admin/Dashboard/` - Dashboard widgets
- `Admin/Forms/` - CRUD forms
- `UI/` - Reusable UI components
- `Header/` - Navigation header
- `Notifications/` - Toast notifications

#### 3. Contexts (`/src/contexts/`)
- `AuthContext.tsx` - Authentication state management

#### 4. Services (`/src/services/`)
- `apiService.ts` - API client with all endpoints
- `http.ts` - HTTP request utilities

#### 5. Hooks (`/src/hooks/`)
- `useApiState.ts` - API state management hooks

#### 6. Types (`/src/types/`)
- `api.ts` - TypeScript interfaces for API responses

### Component Relationships

```typescript
// App.tsx imports
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './AppRoutes';

// AuthContext.tsx imports
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

// Admin pages import
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
```

## API Relationships

### RESTful API Structure

```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
GET    /api/auth/me                - Get current user
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout user

GET    /api/patients               - List patients
POST   /api/patients               - Create patient
GET    /api/patients/:id           - Get patient
PATCH  /api/patients/:id           - Update patient
DELETE /api/patients/:id           - Delete patient

GET    /api/providers              - List providers
POST   /api/providers              - Create provider
GET    /api/providers/:id          - Get provider
PATCH  /api/providers/:id          - Update provider
DELETE /api/providers/:id          - Delete provider

GET    /api/appointments           - List appointments
POST   /api/appointments           - Create appointment
GET    /api/appointments/:id       - Get appointment
PATCH  /api/appointments/:id       - Update appointment
DELETE /api/appointments/:id       - Delete appointment

GET    /api/appointment-types      - List appointment types
POST   /api/appointment-types      - Create appointment type
GET    /api/appointment-types/:id  - Get appointment type
PATCH  /api/appointment-types/:id  - Update appointment type
DELETE /api/appointment-types/:id  - Delete appointment type

GET    /api/admin/contacts         - List contacts (admin)
POST   /api/admin/contacts         - Create contact
GET    /api/admin/contacts/:id     - Get contact
PATCH  /api/admin/contacts/:id     - Update contact
DELETE /api/admin/contacts/:id     - Delete contact

POST   /api/contact                - Public contact form
GET    /api/health                 - Health check
```

### API Service Structure

```typescript
// apiService.ts structure
export const apiService = {
  auth: {
    login,
    register,
    me,
    refreshToken,
    logout
  },
  patients: {
    getAll: getPatients,
    getOne: getPatient,
    create: createPatient,
    update: updatePatient,
    delete: deletePatient
  },
  providers: {
    getAll: getProviders,
    getOne: getProvider,
    create: createProvider,
    update: updateProvider,
    delete: deleteProvider
  },
  appointments: {
    getAll: getAppointments,
    getOne: getAppointment,
    create: createAppointment,
    update: updateAppointment,
    delete: deleteAppointment
  },
  contacts: {
    getAll: getContacts,
    getOne: getContact,
    create: createContact,
    update: updateContact,
    delete: deleteContact
  }
};
```

## Authentication Flow

### JWT Authentication Flow

```
1. User Login
   Frontend ──► Backend (/api/auth/login)
       │              │
       │              ▼
       │       ┌─────────────┐
       │       │authService  │
       │       │.login()     │
       │       └─────────────┘
       │              │
       │              ▼
       │       ┌─────────────┐
       │       │   User      │
       │       │   Model     │
       │       └─────────────┘
       │              │
       │              ▼
       │       ┌─────────────┐
       │       │RefreshToken │
       │       │   Model     │
       │       └─────────────┘
       │              │
       │              ▼
       │     JWT Tokens Generated
       │              │
       │              ▼
   ◄─── Backend ──► Frontend
   Access & Refresh Tokens

2. API Request
   Frontend ──► Backend (with Authorization header)
       │              │
       │              ▼
       │       ┌─────────────┐
       │       │  auth       │
       │       │ middleware  │
       │       └─────────────┘
       │              │
       │              ▼
       │       ┌─────────────┐
       │       │ JWT Verify  │
       │       └─────────────┘
       │              │
       │              ▼
       │     User Context Available
       │              │
       │              ▼
   ◄─── Backend ──► Frontend
       API Response

3. Token Refresh
   Frontend ──► Backend (/api/auth/refresh)
       │              │
       │              ▼
       │       ┌─────────────┐
       │       │authService  │
       │       │.refresh()   │
       │       └─────────────┘
       │              │
       │              ▼
       │       ┌─────────────┐
       │       │RefreshToken │
       │       │   Model     │
       │       └─────────────┘
       │              │
       │              ▼
   ◄─── Backend ──► Frontend
   New Access Token
```

### Role-Based Access Control

```typescript
// Role hierarchy (roleBasedAccess.ts)
export const ROLE_HIERARCHY = {
  'super_admin': 5,
  'admin': 4,
  'manager': 3,
  'dentist': 2,
  'assistant': 1
};

// Resource permissions
export const RESOURCE_PERMISSIONS = {
  patients: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'dentist', 'assistant'],
    update: ['admin', 'manager'],
    delete: ['admin']
  },
  appointments: {
    create: ['admin', 'manager', 'dentist'],
    read: ['admin', 'manager', 'dentist', 'assistant'],
    update: ['admin', 'manager', 'dentist'],
    delete: ['admin', 'manager']
  }
};
```

## Business Logic Flow

### Appointment Scheduling Flow

```
Patient Requests Appointment
            │
            ▼
    ┌─────────────┐
    │  Frontend   │
    │Appointment  │
    │   Form      │
    └─────────────┘
            │
            ▼
    ┌─────────────┐     ┌─────────────┐
    │ apiService  │────►│scheduling   │
    │.createAppt()│     │ Service     │
    └─────────────┘     └─────────────┘
            │                   │
            │                   ▼
            │        ┌─────────────────────┐
            │        │availabilityService  │
            │        │.checkConflicts()    │
            │        └─────────────────────┘
            │                   │
            │                   ▼
            │        ┌─────────────────────┐
            │        │   Provider Model    │
            │        │ .findAvailableSlots │
            │        └─────────────────────┘
            │                   │
            │                   ▼
            │        ┌─────────────────────┐
            │        │ Appointment Model   │
            │        │ .create()           │
            │        └─────────────────────┘
            │                   │
            │                   ▼
    ◄────── Backend ──────► Frontend
        Success/Error Response
```

### Patient Management Flow

```
CRUD Operation Request
            │
            ▼
    ┌─────────────┐
    │  Frontend   │
    │ Patient     │
    │Component    │
    └─────────────┘
            │
            ▼
    ┌─────────────┐     ┌─────────────┐
    │ apiService  │────►│ patient     │
    │.getPatients()│    │ Service     │
    └─────────────┘     └─────────────┘
            │                   │
            │                   ▼
            │        ┌─────────────────────┐
            │        │  Patient Model      │
            │        │ .find()/.create()   │
            │        └─────────────────────┘
            │                   │
            │                   ▼
            │        ┌─────────────────────┐
            │        │   Clinic Model      │
            │        │ .populate('clinic') │
            │        └─────────────────────┘
            │                   │
            │                   ▼
    ◄────── Backend ──────► Frontend
        Patient Data Response
```

## Component Relationships

### React Component Tree

```
App
├── AuthProvider (Context)
│   ├── BrowserRouter
│   │   ├── Routes
│   │   │   ├── Route (/)
│   │   │   │   └── Home
│   │   │   ├── Route (/login)
│   │   │   │   └── LoginPage
│   │   │   │       └── LoginForm
│   │   │   │           └── FormField
│   │   │   ├── Route (/register)
│   │   │   │   └── RegisterPage
│   │   │   │       └── RegisterForm
│   │   │   ├── ProtectedRoute (/admin/*)
│   │   │   │   └── AdminLayout
│   │   │   │       ├── Header
│   │   │   │       │   └── UserMenu
│   │   │   │       ├── Sidebar
│   │   │   │       └── AdminRoutes
│   │   │   │           ├── Route (/admin)
│   │   │   │           │   └── Dashboard
│   │   │   │           │       ├── StatsCards
│   │   │   │           │       └── RecentActivity
│   │   │   │           ├── Route (/admin/patients)
│   │   │   │           │   └── PatientManagement
│   │   │   │           │       ├── PatientList
│   │   │   │           │       ├── PatientForm
│   │   │   │           │       └── PatientDetails
│   │   │   │           ├── Route (/admin/appointments)
│   │   │   │           │   └── AppointmentCalendar
│   │   │   │           │       ├── Calendar
│   │   │   │           │       ├── AppointmentForm
│   │   │   │           │       └── TimeSlotPicker
│   │   │   │           ├── Route (/admin/contacts)
│   │   │   │           │   └── ContactManagement
│   │   │   │           │       ├── ContactList
│   │   │   │           │       ├── ContactForm
│   │   │   │           │       └── ContactFilters
```

### Component Dependencies

```typescript
// Dashboard.tsx dependencies
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { StatsCard } from '../UI/StatsCard';
import { RecentActivity } from './RecentActivity';

// PatientManagement.tsx dependencies
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { PatientList } from './PatientList';
import { PatientForm } from './PatientForm';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
```

## Data Flow

### Frontend to Backend Data Flow

```
User Action ──► React Component ──► useApiState Hook ──► apiService
                                                           │
                                                           ▼
HTTP Request ──► Express Route ──► Controller/Middleware ──► Service
                                                           │
                                                           ▼
Business Logic ──► Mongoose Model ──► MongoDB Query ──► Database
                                                           │
                                                           ▼
Database Result ──► Mongoose Model ──► Service ──► Controller
                                                           │
                                                           ▼
JSON Response ──► apiService ──► useApiState Hook ──► React Component
                                                           │
                                                           ▼
UI Update ──► User Interface
```

### State Management Flow

```
AuthContext
    ├── accessToken (localStorage)
    ├── user (state)
    ├── loading (state)
    ├── error (state)
    └── logoutReason (state)

useApiState Hook
    ├── data (state)
    ├── loading (state)
    ├── error (state)
    └── execute (function)

Component State
    ├── formData (state)
    ├── isSubmitting (state)
    ├── validationErrors (state)
    └── showModal (state)
```

## File Structure & Dependencies

### Complete File Structure

```
topsmile/
├── package.json
├── tsconfig.json
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.tsx
│   ├── AppRoutes.tsx
│   ├── index.tsx
│   ├── reportWebVitals.ts
│   ├── setupTests.ts
│   ├── components/
│   │   ├── Auth/
│   │   │   └── LoginForm/
│   │   ├── Admin/
│   │   │   ├── Dashboard/
│   │   │   ├── Forms/
│   │   │   └── Tables/
│   │   ├── UI/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Select/
│   │   ├── Header/
│   │   ├── Notifications/
│   │   └── ErrorBoundary/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useApiState.ts
│   ├── pages/
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PatientManagement.tsx
│   │   │   ├── ProviderManagement.tsx
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   └── ContactManagement.tsx
│   │   └── FormRenderer/
│   ├── services/
│   │   ├── apiService.ts
│   │   └── http.ts
│   ├── types/
│   │   └── api.ts
│   └── utils/
│       └── logger.ts
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── swagger.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── database.ts
│   │   │   └── roleBasedAccess.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Clinic.ts
│   │   │   ├── Patient.ts
│   │   │   ├── Provider.ts
│   │   │   ├── Appointment.ts
│   │   │   ├── AppointmentType.ts
│   │   │   ├── Contact.ts
│   │   │   └── RefreshToken.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── patients.ts
│   │   │   ├── providers.ts
│   │   │   ├── appointments.ts
│   │   │   ├── appointmentTypes.ts
│   │   │   ├── calendar.ts
│   │   │   ├── forms.ts
│   │   │   └── docs.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── patientService.ts
│   │   │   ├── providerService.ts
│   │   │   ├── contactService.ts
│   │   │   ├── schedulingService.ts
│   │   │   ├── availabilityService.ts
│   │   │   └── appointmentTypeService.ts
│   │   ├── types/
│   │   │   └── express.d.ts
│   │   └── utils/
│   │       └── time.ts
│   └── tests/
│       ├── integration/
│       │   └── authRoutes.test.ts
│       └── unit/
│           ├── services/
│           └── testHelpers.ts
└── README.md
```

### Key Dependencies

#### Frontend Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.30.1",
    "framer-motion": "^10.16.5",
    "react-calendar": "^6.0.0",
    "react-icons": "^4.12.0",
    "luxon": "^3.7.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.8.0",
    "jest": "^30.1.3",
    "cypress": "^15.1.0"
  }
}
```

#### Backend Dependencies (backend/package.json)
```json
{
  "dependencies": {
    "express": "^4.21.2",
    "mongoose": "^8.18.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.2.0",
    "express-rate-limit": "^7.5.1",
    "express-validator": "^7.2.1",
    "nodemailer": "^6.10.1",
    "swagger-ui-express": "^5.0.1",
    "date-fns": "^4.1.0",
    "luxon": "^3.7.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.23",
    "@types/mongoose": "^5.11.97",
    "jest": "^29.7.0",
    "supertest": "^7.1.4",
    "nodemon": "^3.1.10"
  }
}
```

## Testing Structure

### Test File Organization

```
backend/tests/
├── integration/
│   └── authRoutes.test.ts
├── unit/
│   ├── services/
│   │   ├── authService.test.ts
│   │   ├── contactService.test.ts
│   │   └── patientService.test.ts
│   └── models/
│       ├── User.test.ts
│       └── Contact.test.ts
└── testHelpers.ts
```

### Test Dependencies

```typescript
// testHelpers.ts exports
export const createTestUser = async (overrides = {}) => { ... };
export const createTestClinic = async (overrides = {}) => { ... };
export const createTestContact = async (overrides = {}) => { ... };
export const generateAuthToken = (userId: string, role = 'admin') => { ... };
```

### Test Relationships

```typescript
// authRoutes.test.ts dependencies
import request from 'supertest';
import express from 'express';
import { authService } from '../../src/services/authService';
import { createTestUser } from '../testHelpers';

// authService.test.ts dependencies
import { authService } from '../../../src/services/authService';
import { User } from '../../../src/models/User';
import { createTestUser, createTestClinic } from '../../testHelpers';
```

## Configuration & Environment

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/topsmile
JWT_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

### Configuration Files

#### Database Configuration (`backend/src/config/database.ts`)
```typescript
export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
```

#### Swagger Configuration (`backend/src/config/swagger.ts`)
```typescript
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TopSmile API',
      version: '1.0.0',
      description: 'Clinical Management System API'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.ts']
});
```

### Build & Development Scripts

#### Frontend Scripts
```json
{
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "cross-env NODE_ENV=test jest --runInBand",
  "dev": "concurrently \"npm run server\" \"npm run start\""
}
```

#### Backend Scripts
```json
{
  "dev": "nodemon src/app.ts",
  "build": "tsc",
  "start": "node dist/app.js",
  "test": "jest",
  "lint": "eslint src/**/*.ts"
}
```

## Summary

The TopSmile codebase demonstrates a well-structured, scalable clinical management system with clear separation of concerns:

1. **Clean Architecture**: MVC pattern with service layer abstraction
2. **Type Safety**: Comprehensive TypeScript usage throughout
3. **Security**: JWT authentication, role-based access control, input validation
4. **Scalability**: Modular design with clear component boundaries
5. **Maintainability**: Consistent code patterns and comprehensive documentation
6. **Testing**: Unit and integration tests with proper mocking
7. **Developer Experience**: Hot reloading, linting, and clear project structure

The relationships between components are well-defined with:
- Clear data flow from frontend to backend
- Proper service layer abstraction
- Consistent API design patterns
- Modular component architecture
- Comprehensive type definitions
- Proper error handling and validation

This documentation provides a complete overview of how all parts of the system interact and depend on each other, making it easier for developers to understand, maintain, and extend the codebase.
