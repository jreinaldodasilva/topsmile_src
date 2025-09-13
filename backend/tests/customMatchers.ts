// Custom Jest matchers for domain-specific assertions
import { Appointment } from '../src/models/Appointment';
import { User } from '../src/models/User';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAppointment(): R;
      toBeValidUser(): R;
      toBeValidEmail(): R;
      toBeValidPhone(): R;
      toHaveValidTokenStructure(): R;
    }
  }
}

expect.extend({
  toBeValidAppointment(received: any) {
    const hasRequiredFields = received &&
                             received.patient &&
                             received.provider &&
                             received.scheduledStart &&
                             received.scheduledEnd &&
                             received.type &&
                             received.status;

    const hasValidStatus = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(received.status);
    const hasValidType = ['Consulta', 'Limpeza', 'Tratamento de Canal', 'Extração', 'Ortodontia', 'Profilaxia'].includes(received.type);

    const isValid = hasRequiredFields && hasValidStatus && hasValidType;

    return {
      message: () => `Expected ${JSON.stringify(received)} to be a valid appointment`,
      pass: isValid
    };
  },

  toBeValidUser(received: any) {
    const hasRequiredFields = received &&
                             received.name &&
                             received.email &&
                             received.password &&
                             received.role;

    const hasValidRole = ['admin', 'provider', 'patient', 'super_admin'].includes(received.role);
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email);

    const isValid = hasRequiredFields && hasValidRole && hasValidEmail;

    return {
      message: () => `Expected ${JSON.stringify(received)} to be a valid user`,
      pass: isValid
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(received);

    return {
      message: () => `Expected ${received} to be a valid email address`,
      pass: isValid
    };
  },

  toBeValidPhone(received: string) {
    // Brazilian phone pattern: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    const isValid = phoneRegex.test(received);

    return {
      message: () => `Expected ${received} to be a valid Brazilian phone number`,
      pass: isValid
    };
  },

  toHaveValidTokenStructure(received: string) {
    try {
      const parts = received.split('.');
      const isValid = parts.length === 3 &&
                     parts[0].length > 0 &&
                     parts[1].length > 0 &&
                     parts[2].length > 0;

      return {
        message: () => `Expected ${received} to have valid JWT structure`,
        pass: isValid
      };
    } catch (error) {
      return {
        message: () => `Expected ${received} to have valid JWT structure`,
        pass: false
      };
    }
  }
});

// Helper functions for common test assertions
export const expectValidAppointment = (appointment: any) => {
  expect(appointment).toBeValidAppointment();
};

export const expectValidUser = (user: any) => {
  expect(user).toBeValidUser();
};

export const expectValidEmail = (email: string) => {
  expect(email).toBeValidEmail();
};

export const expectValidPhone = (phone: string) => {
  expect(phone).toBeValidPhone();
};

export const expectValidToken = (token: string) => {
  expect(token).toHaveValidTokenStructure();
};

// Domain-specific assertion helpers
export const expectAppointmentConflict = (response: any) => {
  expect(response.status).toBe(409);
  expect(response.body.message).toContain('conflict');
};

export const expectAuthenticationRequired = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.message).toMatch(/autenticação|token/i);
};

export const expectAuthorizationDenied = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.body.message).toMatch(/acesso negado|permissão/i);
};

export const expectValidationError = (response: any) => {
  expect([400, 422]).toContain(response.status);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBeDefined();
};
