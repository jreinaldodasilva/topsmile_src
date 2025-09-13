# Backend Directory Structure

This document provides an overview of the backend directory structure for the TopSmile dental management system API, built with Node.js, TypeScript, and Express.js.

## Root Backend Files

- **backend/backend_test_suite_guide.md**: Documentation for the backend testing suite, including setup and running tests.
- **backend/jest.config.js**: Jest configuration for running unit and integration tests.
- **backend/package-lock.json**: Lockfile for npm dependencies.
- **backend/package.json**: Project metadata, scripts, and dependencies.
- **backend/tsconfig.json**: TypeScript compiler configuration.

## Reports Directory

- **backend/reports/junit.xml**: JUnit XML test report output for CI/CD integration.

## Source Code (src/)

### Main Application

- **backend/src/app.ts**: Main Express application entry point. Configures middleware, routes, database connection, security (helmet, CORS, rate limiting), email handling, and health check endpoints.

### Configuration

- **backend/src/config/database.ts**: Database connection configuration using Mongoose for MongoDB.
- **backend/src/config/swagger.ts**: Swagger/OpenAPI documentation configuration.

### Middleware

- **backend/src/middleware/auth.ts**: JWT authentication middleware for protecting routes.
- **backend/src/middleware/database.ts**: Database connection middleware and error handling.
- **backend/src/middleware/patientAuth.ts**: Authentication middleware specific to patient portal.
- **backend/src/middleware/roleBasedAccess.ts**: Role-based access control middleware for different user types (admin, dentist, assistant).

### Models (Database Schemas)

- **backend/src/models/Appointment.ts**: Mongoose schema for appointment data.
- **backend/src/models/AppointmentType.ts**: Schema for different types of appointments (consultation, procedure, etc.).
- **backend/src/models/Clinic.ts**: Schema for clinic information and settings.
- **backend/src/models/Contact.ts**: Schema for contact form submissions and lead management.
- **backend/src/models/Patient.ts**: Schema for patient information and medical records.
- **backend/src/models/PatientUser.ts**: Schema for patient user accounts (portal access).
- **backend/src/models/Provider.ts**: Schema for healthcare providers (dentists, hygienists).
- **backend/src/models/RefreshToken.ts**: Schema for JWT refresh tokens storage.
- **backend/src/models/User.ts**: Schema for system users (admin, staff) with authentication.

### Routes (API Endpoints)

- **backend/src/routes/appointments.ts**: API routes for appointment management (CRUD operations).
- **backend/src/routes/appointmentTypes.ts**: Routes for managing appointment types and categories.
- **backend/src/routes/auth.ts**: Authentication routes (login, register, password reset, token refresh).
- **backend/src/routes/calendar.ts**: Calendar integration and scheduling routes.
- **backend/src/routes/docs.ts**: API documentation routes (Swagger UI).
- **backend/src/routes/forms.ts**: Dynamic forms and survey routes.
- **backend/src/routes/patientAuth.ts**: Patient portal authentication routes.
- **backend/src/routes/patients.ts**: Patient management routes.
- **backend/src/routes/providers.ts**: Healthcare provider management routes.

### Services (Business Logic)

- **backend/src/services/appointmentService.ts**: Business logic for appointment scheduling and management.
- **backend/src/services/appointmentTypeService.ts**: Logic for appointment type operations.
- **backend/src/services/authService.ts**: Authentication service handling JWT tokens, user registration, login, and password management.
- **backend/src/services/availabilityService.ts**: Provider availability and scheduling logic.
- **backend/src/services/contactService.ts**: Contact form processing and lead management.
- **backend/src/services/patientAuthService.ts**: Patient portal authentication logic.
- **backend/src/services/patientService.ts**: Patient data management and operations.
- **backend/src/services/providerService.ts**: Healthcare provider data operations.
- **backend/src/services/schedulingService.ts**: Advanced scheduling algorithms and conflict resolution.

### Types

- **backend/src/types/express.d.ts**: TypeScript declarations extending Express types for custom properties.

### Utils

- **backend/src/utils/time.ts**: Time and date utility functions for scheduling.

## Tests Directory

### Test Configuration

- **backend/tests/customMatchers.ts**: Custom Jest matchers for testing.
- **backend/tests/db-test.test.ts**: Database connection and setup tests.
- **backend/tests/setup.ts**: Test environment setup and teardown.
- **backend/tests/testHelpers.ts**: Helper functions and utilities for tests.

### Integration Tests

- **backend/tests/integration/authRoutes.test.ts**: Integration tests for authentication routes.
- **backend/tests/integration/errorBoundary.test.ts**: Error handling integration tests.
- **backend/tests/integration/patientPortal.test.ts**: Patient portal integration tests.
- **backend/tests/integration/patientRoutes.test.ts**: Patient-related route integration tests.
- **backend/tests/integration/performance.test.ts**: Performance testing suite.
- **backend/tests/integration/security.test.ts**: Security-focused integration tests.

### Unit Tests

- **backend/tests/unit/services/**: Unit tests for individual service modules.

## Architecture Overview

The backend follows a layered architecture:

1. **Routes Layer**: Handle HTTP requests and responses, input validation.
2. **Middleware Layer**: Cross-cutting concerns (auth, logging, error handling).
3. **Services Layer**: Business logic and data processing.
4. **Models Layer**: Data persistence and schema definitions.
5. **Utils Layer**: Shared utility functions.

Key features include:
- JWT-based authentication with refresh tokens
- Role-based access control
- Rate limiting and security middleware
- Email notifications via SendGrid
- Comprehensive testing suite
- Swagger API documentation
- MongoDB with Mongoose ODM
