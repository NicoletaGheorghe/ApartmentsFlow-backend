const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRATION_INTERVAL = '1h';

// Mock only what's necessary
jest.mock('axios');
jest.mock('jwt-simple');
jest.mock('passport-jwt');
jest.mock('passport-http-bearer');

// Increase timeout for all tests
jest.setTimeout(60000);

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup MongoDB Memory Server
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
