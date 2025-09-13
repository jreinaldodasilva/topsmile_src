# Backend Test Suite Guide

## Overview

The TopSmile backend uses Jest as the testing framework with TypeScript support. The test suite includes both unit tests for individual services and integration tests for API endpoints.

## Test Structure

```
backend/tests/
├── customMatchers.ts     # Custom Jest matchers for domain-specific assertions
├── db-test.test.ts       # Database connection test
├── setup.ts              # Global test setup (MongoDB Memory Server)
├── testHelpers.ts        # Helper functions for creating test data
├── unit/
│   └── services/         # Unit tests for service layer
│       ├── appointmentService.test.ts
│       ├── authService.test.ts
│       ├── contactService.test.ts
│       ├── patientService.test.ts
│       ├── providerService.test.ts
│       └── schedulingService.test.ts
└── integration/          # Integration tests for API routes
    ├── authRoutes.test.ts
    ├── errorBoundary.test.ts
    ├── patientPortal.test.ts
    ├── patientRoutes.test.ts
    ├── performance.test.ts
    └── security.test.ts
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Preset**: `ts-jest` for TypeScript support
- **Environment**: Node.js
- **Test Roots**: `src/` and `tests/` directories
- **Transform Ignore Patterns**: Handles ES modules from specific packages (supertest, @faker-js/faker)
- **Coverage**: Excludes `src/app.ts`, `src/config/`, and type definition files
- **Coverage Reporters**: Text, LCOV, and HTML formats
- **Setup**: `tests/setup.ts` runs before all tests
- **Timeout**: 30 seconds per test
- **Detect Open Handles**: Enabled for MongoDB Memory Server cleanup
- **Force Exit**: Enabled to ensure clean test termination

### Global Setup (`tests/setup.ts`)

- Starts MongoDB Memory Server for isolated testing
- Connects Mongoose to in-memory database
- Clears all collections after each test
- Stops MongoDB Memory Server after all tests

### Database Connection Test (`tests/db-test.test.ts`)

A simple test to verify database connectivity:

```typescript
describe('Database Setup Test', () => {
  it('should connect to database', async () => {
    const mongoose = require('mongoose');
    expect(mongoose.connection.readyState).toBeGreaterThan(0);
  });
});
```

This test ensures that the MongoDB Memory Server is properly started and Mongoose is connected before running other tests.

## Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test appointmentService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create patient"
```

### Test Scripts

- `npm test`: Run all tests once
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report

## Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML Report**: `backend/coverage/lcov-report/index.html`
- **LCOV Format**: `backend/coverage/lcov.info`
- **Text Summary**: Console output

### Coverage Configuration

- Collects coverage from `src/**/*.ts`
- Excludes:
  - `src/app.ts` (entry point)
  - `src/config/**` (configuration files)
  - `src/**/*.d.ts` (type definitions)

## Writing Tests

### Unit Tests

Unit tests focus on individual service functions. Use the test helpers for consistent test data.

```typescript
import { appointmentService } from '../../../src/services/appointmentService';
import { Appointment } from '../../../src/models/Appointment';
import { Patient } from '../../../src/models/Patient';
import { Provider } from '../../../src/models/Provider';
import { AppointmentType } from '../../../src/models/AppointmentType';
import { createTestUser, createTestClinic } from '../../testHelpers';

describe('AppointmentService', () => {
  let testClinic: any;
  let testPatient: any;
  let testProvider: any;
  let testAppointmentType: any;

  beforeEach(async () => {
    testClinic = await createTestClinic();
    testUser = await createTestUser({ clinic: testClinic._id });

    // Create test patient
    testPatient = await Patient.create({
      name: 'Test Patient',
      phone: '(11) 99999-9999',
      email: 'patient@example.com',
      clinic: testClinic._id,
      status: 'active'
    });

    // Create test provider
    testProvider = await Provider.create({
      name: 'Dr. Test Provider',
      email: 'provider@example.com',
      phone: '(11) 88888-8888',
      clinic: testClinic._id,
      specialties: ['Odontologia Geral'],
      licenseNumber: 'CRO-12345',
      status: 'active'
    });

    // Create test appointment type
    testAppointmentType = await AppointmentType.create({
      name: 'Consulta Geral',
      duration: 60,
      color: '#3B82F6',
      category: 'consulta',
      clinic: testClinic._id,
      status: 'active'
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        patient: testPatient._id.toString(),
        provider: testProvider._id.toString(),
        appointmentType: testAppointmentType._id.toString(),
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T11:00:00Z'),
        notes: 'Primeira consulta',
        clinic: testClinic._id.toString()
      };

      const result = await appointmentService.createAppointment(appointmentData);

      expect(result).toBeDefined();
      expect(result.patient.toString()).toBe(testPatient._id.toString());
      expect(result.provider.toString()).toBe(testProvider._id.toString());
      expect(result.status).toBe('scheduled');
    });
  });
});
```

### Integration Tests

Integration tests test complete API endpoints using supertest.

```typescript
import request from 'supertest';
import app from '../../src/app';
import { createTestUser } from '../testHelpers';

describe('Patient Routes', () => {
  it('should create patient via API', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user._id);

    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'João Silva',
        phone: '+5511999999999'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## Test Helpers

The `testHelpers.ts` file provides utilities for creating test data:

### Database Setup
- `setupTestDB()`: Initialize test database
- `teardownTestDB()`: Clean up test database

### Test Data Creation
- `createTestUser()`: Create test user with default data
- `createTestClinic()`: Create test clinic with default data
- `createTestContact()`: Create test contact with default data

### Authentication
- `generateAuthToken()`: Generate mock JWT token for testing

### Realistic Data Generation
- `createRealisticPatient()`: Create patient with realistic data using faker
- `createRealisticProvider()`: Create provider with realistic data using faker
- `createRealisticAppointment()`: Generate realistic appointment data structure
- `createTestUserWithClinic()`: Create user associated with a clinic

## Custom Matchers

The test suite includes custom Jest matchers for domain-specific assertions, defined in `customMatchers.ts`. These matchers provide reusable validation logic for common test scenarios.

### Available Matchers

#### Domain Object Validation
- `toBeValidAppointment()`: Validates appointment objects have required fields and valid status/type
- `toBeValidUser()`: Validates user objects have required fields, valid role, and email format
- `toBeValidEmail()`: Validates email address format
- `toBeValidPhone()`: Validates Brazilian phone number format (e.g., (11) 99999-9999)
- `toHaveValidTokenStructure()`: Validates JWT token structure

#### Response Validation Helpers
- `expectAppointmentConflict()`: Asserts 409 status with conflict message
- `expectAuthenticationRequired()`: Asserts 401 status with authentication message
- `expectAuthorizationDenied()`: Asserts 403 status with authorization message
- `expectValidationError()`: Asserts 400/422 status with validation error

### Usage Examples

```typescript
import '../customMatchers';

describe('User Validation', () => {
  it('should validate user object', () => {
    const user = { name: 'João', email: 'joao@example.com', role: 'admin', password: 'pass' };
    expect(user).toBeValidUser();
  });

  it('should validate email format', () => {
    expect('test@example.com').toBeValidEmail();
  });

  it('should validate phone format', () => {
    expect('(11) 99999-9999').toBeValidPhone();
  });
});

describe('API Responses', () => {
  it('should handle appointment conflicts', async () => {
    const response = await request(app).post('/api/appointments').send(conflictingData);
    expectAppointmentConflict(response);
  });

  it('should require authentication', async () => {
    const response = await request(app).get('/api/protected');
    expectAuthenticationRequired(response);
  });
});
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use unique data for each test
- Clean up after tests (handled by global setup)

### 2. Test Naming
- Use descriptive test names: `should create patient successfully`
- Group related tests in `describe` blocks
- Use `it` for individual test cases

### 3. Assertions
- Use specific matchers (`toBe`, `toEqual`, `toContain`)
- Test both success and error cases
- Verify data structure and types

### 4. Mocking
- Mock external dependencies (email services, external APIs)
- Use Jest mocks for service layer in integration tests
- Avoid mocking database operations in integration tests

### 5. Coverage Goals
- Aim for >80% code coverage
- Focus on critical business logic
- Cover error handling paths

## Common Patterns

### Testing Async Operations
```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases
```typescript
it('should handle errors gracefully', async () => {
  await expect(invalidOperation()).rejects.toThrow('Error message');
});
```

### Testing API Responses
```typescript
it('should return correct response format', async () => {
  const response = await request(app).get('/api/test');
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
});
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure MongoDB Memory Server is properly configured
   - Check for port conflicts

2. **Test Timeouts**
   - Increase timeout in `jest.config.js`
   - Check for hanging database connections

3. **Import Errors**
   - Verify TypeScript compilation
   - Check path aliases in `tsconfig.json`

4. **Validation Errors for Invalid Enum Values**
   - Ensure test data uses valid enum values as defined in models
   - For example, Provider specialties must be one of: 'general_dentistry', 'orthodontics', 'oral_surgery', 'periodontics', 'endodontics', 'prosthodontics', 'pediatric_dentistry', 'oral_pathology', 'dental_hygiene'
   - Check model definitions for valid enum options

5. **TypeScript Errors in Tests**
   - Ensure proper typing for Mongoose documents
   - Use `as any` for _id when needed, or properly type the interfaces

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debug info
npm test -- --testNamePattern="debug test" --verbose

# Run only unit tests
npm test -- tests/unit/

# Run only integration tests
npm test -- tests/integration/

# Use debugger in VS Code
// Add this to test file
debugger;
```

## CI/CD Integration

For continuous integration, add to your pipeline:

```yaml
- name: Run Backend Tests
  run: |
    cd backend
    npm install
    npm test -- --coverage --watchAll=false
    npm run lint
```

## Maintenance

### Adding New Tests

1. Create test file in appropriate directory (`unit/` or `integration/`)
2. Follow naming convention: `*.test.ts`
3. Import necessary dependencies and helpers
4. Write descriptive test cases
5. Run tests to ensure they pass

### Updating Test Helpers

When adding new models or services:

1. Add creation functions to `testHelpers.ts`
2. Update existing tests to use new helpers
3. Ensure backward compatibility

This guide should be updated as the test suite evolves and new patterns emerge.
