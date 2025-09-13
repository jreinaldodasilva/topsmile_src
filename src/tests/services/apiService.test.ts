import { apiService } from '../../services/apiService';

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('apiService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('auth methods', () => {
    describe('login', () => {
      it('should successfully login with valid credentials', async () => {
        const mockResponse = {
          success: true,
          data: {
            user: {
              _id: 'user123',
              name: 'Admin User',
              email: 'admin@topsmile.com',
              role: 'admin'
            },
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: '3600'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.auth.login('admin@topsmile.com', 'SecurePass123!');

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.user).toBeDefined();
        expect(result.data?.accessToken).toBe('mock-access-token');
        expect(result.data?.refreshToken).toBe('mock-refresh-token');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              email: 'admin@topsmile.com',
              password: 'SecurePass123!'
            })
          })
        );
      });

      it('should handle login failure with invalid credentials', async () => {
        const mockResponse = {
          success: false,
          message: 'E-mail ou senha inválidos'
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.auth.login('invalid@example.com', 'wrongpassword');

        expect(result.success).toBe(false);
        expect(result.message).toContain('E-mail ou senha inválidos');
      });

      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await apiService.auth.login('test@example.com', 'password');

        expect(result.success).toBe(false);
        expect(result.message).toContain('Network error');
      });
    });

    describe('register', () => {
      it('should successfully register a new user', async () => {
        const mockResponse = {
          success: true,
          data: {
            user: {
              _id: 'user456',
              name: 'New User',
              email: 'newuser@example.com',
              role: 'dentist'
            },
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const registerData = {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePass123!'
        };

        const result = await apiService.auth.register(registerData);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.user.name).toBe(registerData.name);
        expect(result.data?.user.email).toBe(registerData.email);
      });
    });

    describe('me', () => {
      it('should get current user data', async () => {
        const mockResponse = {
          success: true,
          data: {
            _id: 'user123',
            name: 'Current User',
            email: 'current@example.com',
            role: 'admin'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.auth.me();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe('Current User');
      });
    });
  });

  describe('patients methods', () => {
    describe('getAll', () => {
      it('should get all patients', async () => {
        const mockResponse = {
          success: true,
          data: [
            {
              _id: 'patient1',
              firstName: 'João',
              lastName: 'Silva',
              email: 'joao@example.com'
            },
            {
              _id: 'patient2',
              firstName: 'Maria',
              lastName: 'Santos',
              email: 'maria@example.com'
            }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.patients.getAll();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(2);
      });

      it('should handle query parameters', async () => {
        const mockResponse = {
          success: true,
          data: []
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        await apiService.patients.getAll({ search: 'João', page: 1, limit: 10 });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/patients?search=João&page=1&limit=10'),
          expect.any(Object)
        );
      });
    });

    describe('getOne', () => {
      it('should get patient by ID', async () => {
        const mockResponse = {
          success: true,
          data: {
            _id: 'patient123',
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.patients.getOne('patient123');

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?._id).toBe('patient123');
        expect(result.data?.firstName).toBe('João');
      });

      it('should handle non-existent patient', async () => {
        const mockResponse = {
          success: false,
          message: 'Paciente não encontrado'
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.patients.getOne('non-existent-id');

        expect(result.success).toBe(false);
        expect(result.message).toContain('Paciente não encontrado');
      });
    });

    describe('create', () => {
      it('should create a new patient', async () => {
        const mockResponse = {
          success: true,
          data: {
            _id: 'new-patient-id',
            firstName: 'New',
            lastName: 'Patient',
            email: 'new.patient@example.com',
            phone: '(11) 99999-9999'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const patientData = {
          firstName: 'New',
          lastName: 'Patient',
          email: 'new.patient@example.com',
          phone: '(11) 99999-9999'
        };

        const result = await apiService.patients.create(patientData);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.firstName).toBe(patientData.firstName);
        expect(result.data?.email).toBe(patientData.email);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/patients'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(patientData)
          })
        );
      });
    });

    describe('update', () => {
      it('should update patient data', async () => {
        const mockResponse = {
          success: true,
          data: {
            _id: 'patient123',
            firstName: 'Updated Name',
            phone: '(11) 88888-8888'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const updateData = {
          firstName: 'Updated Name',
          phone: '(11) 88888-8888'
        };

        const result = await apiService.patients.update('patient123', updateData);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.firstName).toBe(updateData.firstName);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/patients/patient123'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData)
          })
        );
      });
    });

    describe('delete', () => {
      it('should delete patient', async () => {
        const mockResponse = {
          success: true,
          message: 'Paciente removido com sucesso'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.patients.delete('patient123');

        expect(result.success).toBe(true);
        expect(result.message).toContain('Paciente removido com sucesso');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/patients/patient123'),
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });
    });
  });

  describe('contacts methods', () => {
    describe('getAll', () => {
      it('should get all contacts', async () => {
        const mockResponse = {
          success: true,
          data: {
            contacts: [
              { _id: 'contact1', name: 'Contact 1' },
              { _id: 'contact2', name: 'Contact 2' }
            ],
            total: 2
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.contacts.getAll();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data).toHaveProperty('contacts');
        expect(result.data).toHaveProperty('total');
        expect(result.data?.contacts).toHaveLength(2);
      });
    });

    describe('create', () => {
      it('should create a new contact', async () => {
        const mockResponse = {
          success: true,
          data: {
            _id: 'new-contact-id',
            name: 'New Contact',
            email: 'new.contact@example.com'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const contactData = {
          name: 'New Contact',
          email: 'new.contact@example.com',
          phone: '(11) 99999-9999',
          clinic: 'Test Clinic',
          specialty: 'Ortodontia'
        };

        const result = await apiService.contacts.create(contactData);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe(contactData.name);
      });
    });
  });

  describe('appointments methods', () => {
    describe('getAll', () => {
      it('should get all appointments', async () => {
        const mockResponse = {
          success: true,
          data: [
            {
              _id: 'appt1',
              patient: 'patient1',
              provider: 'provider1',
              status: 'scheduled'
            }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.appointments.getAll();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      });
    });

    describe('create', () => {
      it('should create a new appointment', async () => {
        const mockResponse = {
          success: true,
          data: {
            _id: 'new-appt-id',
            patient: 'patient123',
            provider: 'provider123',
            status: 'scheduled'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const appointmentData = {
          patient: 'patient123',
          provider: 'provider123',
          appointmentType: 'type123',
          scheduledStart: new Date('2024-02-15T10:00:00Z'),
          scheduledEnd: new Date('2024-02-15T11:00:00Z'),
          status: 'scheduled' as const,
          notes: 'Test appointment'
        };

        const result = await apiService.appointments.create(appointmentData);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.patient).toBe(appointmentData.patient);
        expect(result.data?.status).toBe(appointmentData.status);
      });
    });
  });

  describe('dashboard methods', () => {
    describe('getStats', () => {
      it('should get dashboard statistics', async () => {
        const mockResponse = {
          success: true,
          data: {
            totalPatients: 1247,
            todayAppointments: 12,
            monthlyRevenue: 45680,
            satisfaction: 4.8
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.dashboard.getStats();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data).toHaveProperty('totalPatients');
        expect(result.data).toHaveProperty('todayAppointments');
        expect(result.data).toHaveProperty('monthlyRevenue');
        expect(result.data).toHaveProperty('satisfaction');
      });
    });
  });

  describe('public methods', () => {
    describe('sendContactForm', () => {
      it('should send contact form successfully', async () => {
        const mockResponse = {
          success: true,
          data: {
            id: 'contact-form-id',
            protocol: 'PROTOCOL-123',
            estimatedResponse: '2 horas'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const contactData = {
          name: 'Test User',
          email: 'test@example.com',
          clinic: 'Test Clinic',
          specialty: 'Ortodontia',
          phone: '(11) 99999-9999'
        };

        const result = await apiService.public.sendContactForm(contactData);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('protocol');
        expect(result.data).toHaveProperty('estimatedResponse');
      });
    });
  });

  describe('system methods', () => {
    describe('health', () => {
      it('should get health status', async () => {
        const mockResponse = {
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            uptime: 123456,
            database: 'connected',
            memory: { used: 100, total: 1000 },
            environment: 'test',
            version: '1.0.0'
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const result = await apiService.system.health();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data).toHaveProperty('timestamp');
        expect(result.data).toHaveProperty('uptime');
        expect(result.data).toHaveProperty('database');
        expect(result.data).toHaveProperty('memory');
        expect(result.data).toHaveProperty('environment');
        expect(result.data).toHaveProperty('version');
      });
    });
  });
});
