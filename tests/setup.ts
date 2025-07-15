import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '@jest/globals';

dotenv.config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;

// Configuration for testing
const TEST_CONFIG = {
  // Use mock database by default, can be overridden with USE_REAL_DB=true
  USE_MOCK_DB: process.env.USE_REAL_DB !== 'true',
  USE_MOCK_REDIS: process.env.USE_REAL_REDIS !== 'true'
};

beforeAll(async () => {
  if (TEST_CONFIG.USE_MOCK_DB) {
    // Use MongoDB Memory Server for isolated testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('🧪 Using MongoDB Memory Server for testing');
  } else {
    // Use real test database
    const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/voucher_app_test';
    await mongoose.connect(testDbUri);
    console.log('🧪 Using real test database');
  }
});

afterAll(async () => {
  // Cleanup
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Export test configuration for use in tests
export { TEST_CONFIG }; 