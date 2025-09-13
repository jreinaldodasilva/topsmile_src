import { expect } from '@jest/globals';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidPhone(): R;
      toBeValidCPF(): R;
      toBeValidUser(): R;
      toBeValidPatient(): R;
      toBeValidAppointment(): R;
      toBeValidContact(): R;
      toHaveValidTokenStructure(): R;
      toBeAccessible(): R;
      toHaveValidFormData(): R;
      toBeValidApiResponse(): R;
      toBeValidErrorResponse(): R;
      toHaveLoadingState(): R;
      toHaveErrorState(): R;
      toBeValidDateRange(): R;
    }
  }
}

// Email validation matcher
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
});

// Brazilian phone validation matcher
expect.extend({
  toBeValidPhone(received: string) {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    const pass = phoneRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Brazilian phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Brazilian phone number (format: (11) 99999-9999)`,
        pass: false,
      };
    }
  },
});

// Brazilian CPF validation matcher
expect.extend({
  toBeValidCPF(received: string) {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const pass = cpfRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid CPF format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid CPF format (XXX.XXX.XXX-XX)`,
        pass: false,
      };
    }
  },
});

// User object validation matcher
expect.extend({
  toBeValidUser(received: any) {
    const requiredFields = ['_id', 'name', 'email', 'role'];
    const validRoles = ['super_admin', 'admin', 'manager', 'dentist', 'assistant'];

    const missingFields = requiredFields.filter(field => !received[field]);
    const hasValidRole = validRoles.includes(received.role);
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email);

    if (missingFields.length === 0 && hasValidRole && hasValidEmail) {
      return {
        message: () => `expected user object not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (missingFields.length > 0) {
        errors.push(`missing required fields: ${missingFields.join(', ')}`);
      }
      if (!hasValidRole) {
        errors.push(`invalid role: ${received.role}`);
      }
      if (!hasValidEmail) {
        errors.push(`invalid email format: ${received.email}`);
      }

      return {
        message: () => `expected user object to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// Patient object validation matcher
expect.extend({
  toBeValidPatient(received: any) {
    const requiredFields = ['_id', 'fullName', 'clinic'];
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];

    const missingFields = requiredFields.filter(field => !received[field]);
    const hasValidGender = !received.gender || validGenders.includes(received.gender);
    const hasValidEmail = !received.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email);
    const hasValidPhone = !received.phone || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(received.phone);

    if (missingFields.length === 0 && hasValidGender && hasValidEmail && hasValidPhone) {
      return {
        message: () => `expected patient object not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (missingFields.length > 0) {
        errors.push(`missing required fields: ${missingFields.join(', ')}`);
      }
      if (!hasValidGender) {
        errors.push(`invalid gender: ${received.gender}`);
      }
      if (!hasValidEmail) {
        errors.push(`invalid email format: ${received.email}`);
      }
      if (!hasValidPhone) {
        errors.push(`invalid phone format: ${received.phone}`);
      }

      return {
        message: () => `expected patient object to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// Appointment object validation matcher
expect.extend({
  toBeValidAppointment(received: any) {
    const requiredFields = ['_id', 'patient', 'provider', 'scheduledStart', 'scheduledEnd', 'status'];
    const validStatuses = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];
    const validPriorities = ['routine', 'urgent', 'emergency'];

    const missingFields = requiredFields.filter(field => !received[field]);
    const hasValidStatus = validStatuses.includes(received.status);
    const hasValidPriority = !received.priority || validPriorities.includes(received.priority);
    const hasValidDates = new Date(received.scheduledStart) < new Date(received.scheduledEnd);

    if (missingFields.length === 0 && hasValidStatus && hasValidPriority && hasValidDates) {
      return {
        message: () => `expected appointment object not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (missingFields.length > 0) {
        errors.push(`missing required fields: ${missingFields.join(', ')}`);
      }
      if (!hasValidStatus) {
        errors.push(`invalid status: ${received.status}`);
      }
      if (!hasValidPriority) {
        errors.push(`invalid priority: ${received.priority}`);
      }
      if (!hasValidDates) {
        errors.push(`scheduledEnd must be after scheduledStart`);
      }

      return {
        message: () => `expected appointment object to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// Contact object validation matcher
expect.extend({
  toBeValidContact(received: any) {
    const requiredFields = ['_id', 'name', 'email', 'phone'];
    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    const validSources = ['website', 'phone', 'referral', 'social_media', 'advertisement'];

    const missingFields = requiredFields.filter(field => !received[field]);
    const hasValidStatus = !received.status || validStatuses.includes(received.status);
    const hasValidSource = !received.source || validSources.includes(received.source);
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email);

    if (missingFields.length === 0 && hasValidStatus && hasValidSource && hasValidEmail) {
      return {
        message: () => `expected contact object not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (missingFields.length > 0) {
        errors.push(`missing required fields: ${missingFields.join(', ')}`);
      }
      if (!hasValidStatus) {
        errors.push(`invalid status: ${received.status}`);
      }
      if (!hasValidSource) {
        errors.push(`invalid source: ${received.source}`);
      }
      if (!hasValidEmail) {
        errors.push(`invalid email format: ${received.email}`);
      }

      return {
        message: () => `expected contact object to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// JWT token structure validation matcher
expect.extend({
  toHaveValidTokenStructure(received: string) {
    const tokenParts = received.split('.');
    const hasThreeParts = tokenParts.length === 3;

    if (hasThreeParts) {
      return {
        message: () => `expected ${received} not to have valid JWT structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid JWT structure (3 parts separated by dots)`,
        pass: false,
      };
    }
  },
});

// Accessibility validation matcher
expect.extend({
  toBeAccessible(received: HTMLElement) {
    const hasAriaLabel = received.hasAttribute('aria-label') || received.hasAttribute('aria-labelledby');
    const hasRole = received.hasAttribute('role') || ['button', 'input', 'select', 'textarea', 'a'].includes(received.tagName.toLowerCase());
    const isFocusable = received.tabIndex >= 0 || ['button', 'input', 'select', 'textarea', 'a'].includes(received.tagName.toLowerCase());

    if (hasAriaLabel && hasRole && isFocusable) {
      return {
        message: () => `expected element not to be accessible`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (!hasAriaLabel) {
        errors.push('missing aria-label or aria-labelledby');
      }
      if (!hasRole) {
        errors.push('missing role or semantic element');
      }
      if (!isFocusable) {
        errors.push('element is not focusable');
      }

      return {
        message: () => `expected element to be accessible, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// Form data validation matcher
expect.extend({
  toHaveValidFormData(received: FormData) {
    const entries = Array.from(received.entries());
    const hasEntries = entries.length > 0;
    const hasValidEntries = entries.every(([key, value]) => key && value !== '');

    if (hasEntries && hasValidEntries) {
      return {
        message: () => `expected FormData not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (!hasEntries) {
        errors.push('FormData is empty');
      }
      if (!hasValidEntries) {
        errors.push('FormData contains empty values');
      }

      return {
        message: () => `expected FormData to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// API response validation matcher
expect.extend({
  toBeValidApiResponse(received: any) {
    const hasSuccessField = typeof received.success === 'boolean';
    const hasDataField = received.hasOwnProperty('data');
    const hasMessageField = !received.message || typeof received.message === 'string';

    if (hasSuccessField && hasDataField && hasMessageField) {
      return {
        message: () => `expected API response not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (!hasSuccessField) {
        errors.push('missing or invalid success field');
      }
      if (!hasDataField) {
        errors.push('missing data field');
      }
      if (!hasMessageField) {
        errors.push('invalid message field');
      }

      return {
        message: () => `expected API response to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// Error response validation matcher
expect.extend({
  toBeValidErrorResponse(received: any) {
    const hasSuccessFalse = received.success === false;
    const hasMessage = typeof received.message === 'string' && received.message.length > 0;
    const hasNullData = received.data === null || received.data === undefined;

    if (hasSuccessFalse && hasMessage && hasNullData) {
      return {
        message: () => `expected error response not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (!hasSuccessFalse) {
        errors.push('success should be false');
      }
      if (!hasMessage) {
        errors.push('missing or empty error message');
      }
      if (!hasNullData) {
        errors.push('data should be null for error responses');
      }

      return {
        message: () => `expected error response to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// Loading state validation matcher
expect.extend({
  toHaveLoadingState(received: HTMLElement) {
    const hasLoadingText = received.textContent?.includes('Carregando') ||
                          received.textContent?.includes('Loading') ||
                          received.querySelector('[data-testid*="loading"]') !== null;
    const hasLoadingClass = received.classList.contains('loading') ||
                           received.querySelector('.loading') !== null;
    const hasSpinner = received.querySelector('[role="progressbar"]') !== null ||
                      received.querySelector('.spinner') !== null;

    if (hasLoadingText || hasLoadingClass || hasSpinner) {
      return {
        message: () => `expected element not to have loading state`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have loading state (loading text, class, or spinner)`,
        pass: false,
      };
    }
  },
});

// Error state validation matcher
expect.extend({
  toHaveErrorState(received: HTMLElement) {
    const hasErrorText = received.textContent?.includes('Erro') ||
                        received.textContent?.includes('Error') ||
                        received.querySelector('[data-testid*="error"]') !== null;
    const hasErrorClass = received.classList.contains('error') ||
                         received.querySelector('.error') !== null;
    const hasErrorRole = received.getAttribute('role') === 'alert' ||
                        received.querySelector('[role="alert"]') !== null;

    if (hasErrorText || hasErrorClass || hasErrorRole) {
      return {
        message: () => `expected element not to have error state`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have error state (error text, class, or alert role)`,
        pass: false,
      };
    }
  },
});

// Date range validation matcher
expect.extend({
  toBeValidDateRange(received: { start: string | Date; end: string | Date }) {
    const startDate = new Date(received.start);
    const endDate = new Date(received.end);
    const isValidStart = !isNaN(startDate.getTime());
    const isValidEnd = !isNaN(endDate.getTime());
    const isValidRange = startDate <= endDate;

    if (isValidStart && isValidEnd && isValidRange) {
      return {
        message: () => `expected date range not to be valid`,
        pass: true,
      };
    } else {
      const errors: string[] = [];
      if (!isValidStart) {
        errors.push('invalid start date');
      }
      if (!isValidEnd) {
        errors.push('invalid end date');
      }
      if (!isValidRange) {
        errors.push('start date must be before or equal to end date');
      }

      return {
        message: () => `expected date range to be valid, but ${errors.join('; ')}`,
        pass: false,
      };
    }
  },
});

// Helper functions for common test assertions
export const expectValidationError = (response: any, field?: string) => {
  expect(response.success).toBe(false);
  expect(response.message).toBeDefined();
  if (field) {
    expect(response.message.toLowerCase()).toContain(field.toLowerCase());
  }
};

export const expectAuthenticationRequired = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.success).toBe(false);
  expect(response.message).toMatch(/token|auth|login/i);
};

export const expectAuthorizationDenied = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.success).toBe(false);
  expect(response.message).toMatch(/permission|access|forbidden/i);
};

export const expectNotFound = (response: any, resource?: string) => {
  expect(response.status).toBe(404);
  expect(response.success).toBe(false);
  if (resource) {
    expect(response.message.toLowerCase()).toContain(resource.toLowerCase());
  }
};

export const expectSuccessfulCreation = (response: any) => {
  expect(response.status).toBe(201);
  expect(response.success).toBe(true);
  expect(response.data).toBeDefined();
  expect(response.data._id).toBeDefined();
};

export const expectSuccessfulUpdate = (response: any) => {
  expect(response.status).toBe(200);
  expect(response.success).toBe(true);
  expect(response.data).toBeDefined();
};

export const expectSuccessfulDeletion = (response: any) => {
  expect(response.status).toBe(200);
  expect(response.success).toBe(true);
};

export const expectPaginatedResponse = (response: any) => {
  expect(response.success).toBe(true);
  expect(response.data).toBeDefined();
  expect(Array.isArray(response.data.items || response.data)).toBe(true);
};
