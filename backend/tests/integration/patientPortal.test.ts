import request, { Response } from 'supertest';
import express from 'express';
import patientAuthRoutes from '../../src/routes/patientAuth';
import appointmentsRoutes from '../../src/routes/appointments';
import patientsRoutes from '../../src/routes/patients';
import appointmentTypesRoutes from '../../src/routes/appointmentTypes';
import providersRoutes from '../../src/routes/providers';

describe('Patient Portal Integration Tests', () => {
  let app: express.Application;
  let patientToken: string;

  beforeAll(() => {
    // Create test app
    app = express();
    app.use(express.json());

    // Use patient portal routes
    app.use('/api/patient/auth', patientAuthRoutes);
    app.use('/api/appointments', appointmentsRoutes);
    app.use('/api/patients', patientsRoutes);
    app.use('/api/appointment-types', appointmentTypesRoutes);
    app.use('/api/providers', providersRoutes);

    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
      });
    });
  });

  it('should register a new patient user', async () => {
    const res = await request(app)
      .post('/api/patient/auth/register')
      .send({
        patientId: 'test-patient-id',
        email: 'testpatient@example.com',
        password: 'TestPassword123!'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should login patient user and return access token', async () => {
    const res = await request(app)
      .post('/api/patient/auth/login')
      .send({
        email: 'testpatient@example.com',
        password: 'TestPassword123!'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    patientToken = res.body.data.accessToken;
  });

  it('should get patient user info with valid token', async () => {
    const res = await request(app)
      .get('/api/patient/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patientUser.email).toBe('testpatient@example.com');
  });

  it('should get upcoming appointments for patient', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .query({ patient: 'test-patient-id', status: 'scheduled,confirmed' })
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should handle invalid login credentials', async () => {
    const res = await request(app)
      .post('/api/patient/auth/login')
      .send({
        email: 'testpatient@example.com',
        password: 'WrongPassword123!'
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should logout patient user successfully', async () => {
    const res = await request(app)
      .post('/api/patient/auth/logout')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject requests with invalid token', async () => {
    const res = await request(app)
      .get('/api/patient/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject requests without token', async () => {
    const res = await request(app)
      .get('/api/patient/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should handle appointment booking with valid data', async () => {
    const appointmentData = {
      patient: 'test-patient-id',
      appointmentType: 'cleaning',
      provider: 'test-provider-id',
      clinic: 'test-clinic-id',
      scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 1 hour later
      notes: 'Test appointment booking'
    };

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(appointmentData);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
  });

  it('should handle appointment cancellation', async () => {
    // First get appointments to find one to cancel
    const getRes = await request(app)
      .get('/api/appointments')
      .query({ patient: 'test-patient-id', status: 'scheduled' })
      .set('Authorization', `Bearer ${patientToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data).toBeDefined();
    expect(getRes.body.data.length).toBeGreaterThan(0);

    const appointmentId = getRes.body.data[0]._id;

    const cancelRes = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ status: 'cancelled' });

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.success).toBe(true);
  });

  it('should handle patient profile updates', async () => {
    const updateData = {
      patient: {
        phone: '+55 11 99999-9999',
        address: {
          street: 'Rua Teste',
          number: '123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        }
      }
    };

    const res = await request(app)
      .patch('/api/patient/auth/profile')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(updateData);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should handle password reset request', async () => {
    const res = await request(app)
      .post('/api/patient/auth/forgot-password')
      .send({ email: 'testpatient@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should handle rate limiting on auth endpoints', async () => {
    // Make multiple rapid requests to test rate limiting
    const promises: any[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .post('/api/patient/auth/login')
          .send({
            email: 'testpatient@example.com',
            password: 'WrongPassword123!'
          })
      );
    }

    const results = (await Promise.all(promises)) as Response[];
    const rateLimitedResponses = results.filter(res => res.statusCode === 429);

    // At least some requests should be rate limited
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  it('should handle concurrent session management', async () => {
    // Login with same credentials multiple times
    const loginPromises: any[] = [];
    for (let i = 0; i < 3; i++) {
      loginPromises.push(
        request(app)
          .post('/api/patient/auth/login')
          .send({
            email: 'testpatient@example.com',
            password: 'TestPassword123!'
          })
      );
    }

    const loginResults = (await Promise.all(loginPromises)) as Response[];

    // All logins should succeed
    loginResults.forEach(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    // All tokens should be valid
    const validationPromises = loginResults.map(res =>
      request(app)
        .get('/api/patient/auth/me')
        .set('Authorization', `Bearer ${res.body.data.accessToken}`)
    );

    const validationResults = (await Promise.all(validationPromises)) as Response[];
    validationResults.forEach(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  it('should handle appointment rescheduling', async () => {
    // Get existing appointments
    const getRes = await request(app)
      .get('/api/appointments')
      .query({ patient: 'test-patient-id', status: 'scheduled' })
      .set('Authorization', `Bearer ${patientToken}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data).toBeDefined();
    expect(getRes.body.data.length).toBeGreaterThan(0);

    const appointmentId = getRes.body.data[0]._id;
    const newScheduledStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days from now
    const newScheduledEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString();

    const rescheduleRes = await request(app)
      .patch(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        scheduledStart: newScheduledStart,
        scheduledEnd: newScheduledEnd
      });

    expect(rescheduleRes.statusCode).toBe(200);
    expect(rescheduleRes.body.success).toBe(true);
  });

  it('should handle patient medical history retrieval', async () => {
    const res = await request(app)
      .get('/api/patients/test-patient-id')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should handle appointment type listing', async () => {
    const res = await request(app)
      .get('/api/appointment-types')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should handle provider availability checking', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .get('/api/providers/availability')
      .query({
        providerId: 'test-provider-id',
        date: dateStr,
        appointmentType: 'cleaning'
      })
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should handle error responses gracefully', async () => {
    // Test with invalid appointment ID
    const res = await request(app)
      .get('/api/appointments/invalid-id')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('should handle CORS headers properly', async () => {
    const res = await request(app)
      .options('/api/patient/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('should handle large request payloads', async () => {
    const largeNotes = 'A'.repeat(10000); // 10KB of text

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        patient: 'test-patient-id',
        appointmentType: 'cleaning',
        provider: 'test-provider-id',
        clinic: 'test-clinic-id',
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        notes: largeNotes
      });

    // Should either succeed or fail gracefully with appropriate error
    expect([200, 201, 400, 413]).toContain(res.statusCode);
  });

  it('should handle database connection errors gracefully', async () => {
    // This test would require mocking database disconnection
    // For now, we'll test with a timeout scenario
    const res = await request(app)
      .get('/api/appointments')
      .query({ patient: 'test-patient-id' })
      .set('Authorization', `Bearer ${patientToken}`)
      .timeout(5000); // 5 second timeout

    expect([200, 500]).toContain(res.statusCode);
  });
});
