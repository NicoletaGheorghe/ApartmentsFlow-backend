module.exports = {
  globalSetup: './jest.global-setup.js',
  globalTeardown: './jest.global-teardown.js',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  // Add any other Jest config options here
};
