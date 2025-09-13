import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createTestUser, generateAuthToken } from '../testHelpers';
import authRoutes from '../../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Security Tests', () => {
  let testUser: any;
  let validToken: string;

  beforeEach(async () => {
    testUser = await createTestUser({
      name: 'Security Test User',
      email: 'security@example.com',
      password: 'SecurePass123!',
      role: 'admin'
    });
    validToken = generateAuthToken(testUser._id.toString(), testUser.role);
  });

  describe('Token Expiration', () => {
    it('should handle expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUser._id.toString(), email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET || 'test-jwt-secret-key',
        {
          expiresIn: '-1h', // Already expired
          issuer: 'topsmile-api',
          audience: 'topsmile-client',
          algorithm: 'HS256'
        }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should handle malformed tokens', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should handle missing tokens', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should handle extremely long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: longString,
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: 'password'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle XSS attempts', async () => {
      const maliciousName = '<script>alert("xss")</script>';
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: maliciousName,
          email: 'xss@example.com',
          password: 'SecurePass123!'
        });

      // Should either sanitize or reject
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid successive requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrong'
          })
      );

      const results = await Promise.all(promises);
      // At least some should fail due to rate limiting or invalid credentials
      const failures = results.filter(r => r.status !== 200);
      expect(failures.length).toBeGreaterThan(0);
    });
  });
});
