const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRATION_INTERVAL = '1h';

// Mock necessary modules
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
};

// Global setup - runs once before all test files
beforeAll(async () => {
  // Create a new MongoDB Memory Server instance
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Connect to the in-memory database
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Wait for the connection to be established
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) {
      resolve();
    } else {
      mongoose.connection.once('connected', resolve);
    }
  });
});

// Global teardown - runs once after all test files
afterAll(async () => {
  // Disconnect from the in-memory database
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Stop the MongoDB Memory Server
  if (mongod) {
    await mongod.stop();
  }
});
