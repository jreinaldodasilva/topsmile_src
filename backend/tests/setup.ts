import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import './customMatchers';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  console.log('Setting up test database with MongoDB Memory Server...');
  // Set JWT_SECRET for tests if not already set
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-key';
  }

  // Start MongoDB Memory Server for test isolation
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  console.log('Connecting to MongoDB Memory Server at:', mongoUri);

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  console.log('Connected to test database');
});

afterAll(async () => {
  // Close database connection
  await mongoose.disconnect();
  console.log('Disconnected from test database');

  // Stop MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB Memory Server stopped');
  }
});

afterEach(async () => {
  // Clear all collections after each test, but only if connected
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany({});
      } catch (error) {
        // Ignore cleanup errors if database is disconnected
        console.warn(`Failed to clean collection ${key}:`, error);
      }
    }
  }
});
