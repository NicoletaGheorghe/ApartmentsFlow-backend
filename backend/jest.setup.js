// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1d';
process.env.MONGODB_URI = 'mongodb://localhost:27017/apartment-test';
process.env.PORT = 5000;

// Add any global test setup here
beforeAll(() => {
  // Global setup before all tests
  jest.setTimeout(30000); // Increase timeout for tests
});

afterAll(async () => {
  // Global cleanup after all tests
  // Clear all mocks
  jest.clearAllMocks();
  // Clear all timers
  jest.clearAllTimers();
  // Reset all mocks
  jest.resetAllMocks();
  // Restore all mocks
  jest.restoreAllMocks();
}); 