const { MongoMemoryServer } = require('mongodb-memory-server');

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
jest.setTimeout(30000);

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
  process.env.MONGODB_URI = mongod.getUri();
});

// Cleanup after all tests
afterAll(async () => {
  await mongod.stop();
});
