import request from 'supertest';
import express from 'express';
import { createTestUser, generateAuthToken } from '../testHelpers';
import authRoutes from '../../src/routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Performance Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    testUser = await createTestUser({
      name: 'Performance Test User',
      email: 'perf@example.com',
      password: 'PerfPass123!',
      role: 'admin'
    });
    authToken = generateAuthToken(testUser._id.toString(), testUser.role);
  });

  describe('Load Testing', () => {
    it('should handle multiple concurrent login requests', async () => {
      const startTime = Date.now();

      const promises = Array(50).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'perf@example.com',
            password: 'PerfPass123!'
          })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);

      console.log(`Load test completed in ${duration}ms for 50 requests`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle rapid successive auth requests', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Rapid auth test completed in ${duration}ms for 20 requests`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'perf@example.com',
            password: 'PerfPass123!'
          });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory increase: ${memoryIncrease} bytes`);
      // Allow some memory increase but not excessive
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  describe('Database Query Performance', () => {
    it('should handle database load efficiently', async () => {
      const startTime = Date.now();

      // Create multiple users for testing
      const userPromises = Array(10).fill(null).map((_, i) =>
        createTestUser({
          name: `Perf User ${i}`,
          email: `perf${i}@example.com`,
          password: 'PerfPass123!',
          role: 'admin'
        })
      );

      await Promise.all(userPromises);

      // Test login for each user
      const loginPromises = Array(10).fill(null).map((_, i) =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: `perf${i}@example.com`,
            password: 'PerfPass123!'
          })
      );

      await Promise.all(loginPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Database performance test completed in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should respond quickly to auth endpoints', async () => {
      const endpoints = [
        { method: 'POST', path: '/api/auth/login', data: { email: 'perf@example.com', password: 'PerfPass123!' } },
        { method: 'GET', path: '/api/auth/me', headers: { Authorization: `Bearer ${authToken}` } },
        { method: 'POST', path: '/api/auth/logout', headers: { Authorization: `Bearer ${authToken}` }, data: { refreshToken: 'dummy' } }
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();

        let req: request.Test;
        if (endpoint.method === 'POST') {
          req = request(app).post(endpoint.path);
        } else if (endpoint.method === 'GET') {
          req = request(app).get(endpoint.path);
        } else {
          throw new Error(`Unsupported method: ${endpoint.method}`);
        }

        if (endpoint.headers) {
          req = req.set(endpoint.headers);
        }

        if (endpoint.data) {
          req = req.send(endpoint.data);
        }

        await req.expect((res: any) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          console.log(`${endpoint.method} ${endpoint.path}: ${duration}ms`);
          expect(duration).toBeLessThan(1000); // Each request should be under 1 second
        });
      }
    });
  });
});
