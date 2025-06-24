# Testing Troubleshooting Guide

## Table of Contents
1. [Test Environment Setup](#test-environment-setup)
2. [Database Testing Issues](#database-testing-issues)
3. [Authentication Issues in Tests](#authentication-issues-in-tests)
4. [Schema Validation Errors](#schema-validation-errors)
5. [Test Data Isolation](#test-data-isolation)
6. [Mock and Stub Issues](#mock-and-stub-issues)
7. [Jest Configuration Issues](#jest-configuration-issues)
8. [Notes Backend Specific Issues](#notes-backend-specific-issues)
9. [Performance Testing Issues](#performance-testing-issues)
10. [Integration Testing Issues](#integration-testing-issues)
11. [Quick Reference](#quick-reference)
12. [Rate Limiting and Test Payload Validity](#rate-limiting-and-test-payload-validity)

---

## Test Environment Setup

### 1. Jest Configuration Issues
**Issue**: Jest not running properly or tests failing due to configuration
**Error**: Various Jest-related errors

**Fix**: Proper Jest configuration in `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 2. Test Setup Function Issues
**Issue**: Test helper functions not properly exported or imported
**Error**: `ReferenceError: setupTestDB is not a function`

**Fix**: Ensure proper test setup:
```javascript
// ✅ CORRECT: Use require instead of destructuring
require('./setup'); // This runs the setup hooks

// ❌ INCORRECT: Don't try to destructure non-existent exports
const { setupTestDB } = require('./setup'); // setupTestDB doesn't exist
```

**Prevention**: 
- Check what's actually exported from setup files
- Use `require('./setup')` to run setup hooks
- Don't assume helper functions exist without checking

### 3. Environment Variable Issues
**Issue**: Tests failing due to missing environment variables
**Error**: `process.env.VARIABLE is undefined`

**Fix**: Set up test environment variables in `jest.setup.js`:
```javascript
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_apartment_search';
process.env.JWT_SECRET = 'test-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
```

### 4. Test Database Connection Issues
**Issue**: Tests can't connect to test database
**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Fix**: Proper test database setup with error handling:
```javascript
// jest.setup.js
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.TEST_MONGODB_URI, {
      maxPoolSize: 1, // Use smaller pool for tests
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Test database connected');
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await mongoose.connection.close();
    console.log('Test database disconnected');
  } catch (error) {
    console.error('Test database disconnection failed:', error);
  }
});
```

---

## Rate Limiting and Test Payload Validity

### 1. Bypassing Rate Limiting in Test Environments
**Issue**: Tests fail with HTTP 429 errors (Too Many Requests) when hitting authentication or other rate-limited endpoints repeatedly.

**Error**: `429 Too Many Requests` or `Too many authentication attempts, please try again later.`

**Fix**: Always bypass rate limiting middleware in test environments by checking `process.env.NODE_ENV === 'test'` before applying rate limiters in your app and middleware. This ensures tests are never blocked by rate limits, regardless of import order or environment setup.

```javascript
// Example: Only apply rate limiting in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth/', authLimiter);
  app.use(apiLimiter);
}
```

### 2. Valid Payloads for Authorization Tests
**Issue**: Tests for authorization (403 errors) send incomplete or invalid payloads, causing validation errors (400) before the authorization check is reached.

**Error**: `400 Validation Error` instead of expected `403 Forbidden`.

**Fix**: Always send a fully valid payload (all required fields) when testing authorization logic. This ensures the controller's authorization check is hit before validation, and the correct status code is returned.

```javascript
// ✅ CORRECT: Send valid payload for unauthorized update test
const validUpdate = {
  title: 'Hacked',
  content: 'Hacked content',
  category: 'general',
  priority: 'medium',
  apartmentId: otherApartment._id,
};
const response = await request(app)
  .put(`/api/notes/${otherNote._id}`)
  .set('Authorization', `Bearer ${authToken}`)
  .send(validUpdate);
expect(response.status).toBe(403);
```

---

## Database Testing Issues

### 1. Database Cleanup Issues
**Issue**: Tests affecting each other due to shared database state
**Error**: Inconsistent test results, data conflicts

**Fix**: Proper test isolation with comprehensive cleanup:
```javascript
// Clean up after each test
afterEach(async () => {
  try {
    // Clean up in order of dependencies
    await Note.deleteMany({});
    await Favorite.deleteMany({});
    await Apartment.deleteMany({});
    await User.deleteMany({});
    await Commute.deleteMany({});
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});
```

### 2. Slow Database Queries in Tests
**Issue**: Tests taking too long due to slow database operations
**Error**: Test timeouts

**Fix**: Optimize test database operations:
```javascript
// Use lean() for read-only operations
const apartments = await Apartment.find().lean();

// Use select() to limit fields
const apartments = await Apartment.find().select('title price location');

// Use bulk operations for multiple documents
const bulkOps = testData.map(data => ({
  insertOne: { document: data }
}));
await Apartment.bulkWrite(bulkOps);
```

### 3. Test Data Factory Pattern
**Issue**: Inconsistent test data creation
**Error**: Tests failing due to missing or invalid data

**Fix**: Implement test data factories:
```javascript
// Test data factories
const createTestUser = (overrides = {}) => ({
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  ...overrides
});

const createTestApartment = (userId, overrides = {}) => ({
  title: 'Test Apartment',
  description: 'A test apartment',
  price: 1000,
  location: {
    type: 'Point',
    coordinates: [-0.1276, 51.5074],
    address: {
      street: '123 Test Street',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 1AA',
      country: 'UK',
    },
  },
  bedrooms: 2,
  bathrooms: 1,
  area: 800,
  owner: userId,
  isPublic: true,
  ...overrides
});

// Usage in tests
const userData = createTestUser({ email: 'specific@example.com' });
const apartmentData = createTestApartment(userId, { price: 2000 });
```

---

## Authentication Issues in Tests

### 1. JWT Token Issues
**Issue**: Tests failing due to invalid JWT tokens
**Error**: 401 Unauthorized errors in tests

**Fix**: Use API endpoints for user creation and authentication in tests:
```javascript
// ✅ CORRECT: Register and login via API
const registerAndLoginUser = async (email = `test${Date.now()}@example.com`) => {
  try {
    // Register via API (ensures password hashing)
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email,
        password: 'password123',
      });
    
    // Login via API (ensures valid token)
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'password123',
      });
    
    return {
      userId: loginResponse.body._id,
      token: loginResponse.body.token,
      user: loginResponse.body
    };
  } catch (error) {
    console.error('User registration/login failed:', error);
    throw error;
  }
};
```

**Prevention**: 
- Always use API endpoints for user creation in tests
- Never create users directly in database (bypasses password hashing)
- Use the same authentication flow as production
- Add error handling for registration/login failures

### 2. Password Hashing Issues
**Issue**: Password comparison failures in tests
**Error**: Login failures despite correct credentials

**Fix**: Ensure consistent password hashing:
```javascript
// Use bcrypt consistently with proper error handling
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Password hashing failed');
  }
};

const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
};
```

### 3. Authentication Middleware Testing
**Issue**: Authentication middleware not working in tests
**Error**: Tests failing due to authentication issues

**Fix**: Test authentication middleware properly:
```javascript
// Test authentication middleware
describe('Authentication Middleware', () => {
  it('should allow authenticated requests', async () => {
    const { token } = await registerAndLoginUser();
    
    const response = await request(app)
      .get('/api/protected-route')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .get('/api/protected-route');
    
    expect(response.status).toBe(401);
  });

  it('should reject invalid tokens', async () => {
    const response = await request(app)
      .get('/api/protected-route')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });
});
```

---

## Schema Validation Errors

### 1. Missing Required Fields
**Issue**: Tests creating documents without all required fields
**Error**: Mongoose validation errors

**Fix**: Always provide all required fields, even in edge case tests:
```javascript
// ✅ CORRECT: Even validation tests need valid data
it('should validate required fields', async () => {
  // Create a valid apartment first
  const validApartment = await createTestApartment(testUser._id);
  
  const response = await request(app)
    .post('/api/notes')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ apartmentId: validApartment._id }); // Only omit note fields

  expect(response.status).toBe(400);
  expect(response.body.errors).toContain('Note title is required');
  expect(response.body.errors).toContain('Note content is required');
});
```

### 2. Data Type Mismatches
**Issue**: Tests sending wrong data types
**Error**: Cast errors or validation failures

**Fix**: Ensure correct data types with validation:
```javascript
// Data type validation helpers
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice > 0;
};

// Use in tests
it('should validate data types', async () => {
  const invalidData = {
    price: 'not-a-number',
    email: 'invalid-email',
    apartmentId: 'invalid-id'
  };
  
  const response = await request(app)
    .post('/api/apartments')
    .set('Authorization', `Bearer ${authToken}`)
    .send(invalidData);
  
  expect(response.status).toBe(400);
  expect(response.body.errors).toContain('Invalid price format');
  expect(response.body.errors).toContain('Invalid email format');
});
```

### 3. Enum Validation Errors
**Issue**: Values not matching enum constraints
**Error**: `ValidationError: Path 'status' is invalid`

**Fix**: Use valid enum values and test edge cases:
```javascript
// Test enum validation
describe('Enum Validation', () => {
  it('should accept valid enum values', async () => {
    const validStatuses = ['available', 'rented', 'maintenance'];
    
    for (const status of validStatuses) {
      const apartmentData = createTestApartment(testUser._id, { status });
      const apartment = new Apartment(apartmentData);
      await expect(apartment.save()).resolves.toBeDefined();
    }
  });

  it('should reject invalid enum values', async () => {
    const apartmentData = createTestApartment(testUser._id, { 
      status: 'invalid-status' 
    });
    const apartment = new Apartment(apartmentData);
    
    await expect(apartment.save()).rejects.toThrow();
  });
});
```

---

## Test Data Isolation

### 1. Shared Test Data Issues
**Issue**: Tests affecting each other due to shared data
**Error**: Inconsistent test results

**Fix**: Create fresh data for each test with proper isolation:
```javascript
// ✅ CORRECT: Each test creates its own data
describe('Notes API', () => {
  let testUser, authToken, testApartment;

  beforeEach(async () => {
    // Create fresh user and apartment for each test
    const { userId, token } = await registerAndLoginUser();
    testUser = { _id: userId };
    authToken = token;
    testApartment = await createTestApartment(userId);
  });

  afterEach(async () => {
    // Clean up is handled by the test setup
  });

  it('should create a note', async () => {
    const noteData = {
      apartmentId: testApartment._id,
      title: 'Test Note',
      content: 'Test content'
    };

    const response = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send(noteData);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(noteData.title);
  });
});
```

### 2. Database State Pollution
**Issue**: Tests leaving data that affects other tests
**Error**: Test failures due to unexpected data

**Fix**: Proper cleanup between tests with error handling:
```javascript
// Clean up all collections after each test
afterEach(async () => {
  try {
    await Promise.all([
      Note.deleteMany({}),
      Favorite.deleteMany({}),
      Apartment.deleteMany({}),
      User.deleteMany({}),
      Commute.deleteMany({}),
    ]);
  } catch (error) {
    console.error('Test cleanup failed:', error);
    // Don't throw error to avoid masking test failures
  }
});
```

### 3. Test Data Dependencies
**Issue**: Tests depending on specific data state
**Error**: Brittle tests that fail when data changes

**Fix**: Use explicit test data setup:
```javascript
// Avoid depending on existing data
it('should not depend on existing data', async () => {
  // Create all required data explicitly
  const user = await User.create(createTestUser());
  const apartment = await Apartment.create(createTestApartment(user._id));
  
  // Test with explicit data
  const response = await request(app)
    .get(`/api/apartments/${apartment._id}`)
    .set('Authorization', `Bearer ${generateToken(user._id)}`);
  
  expect(response.status).toBe(200);
  expect(response.body._id).toBe(apartment._id.toString());
});
```

---

## Mock and Stub Issues

### 1. External Service Mocks
**Issue**: Tests failing due to external service dependencies
**Error**: Network errors or service unavailability

**Fix**: Proper mocking of external services:
```javascript
// Mock external services
jest.mock('../utils/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../utils/cloudinary', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    secure_url: 'https://example.com/image.jpg',
    public_id: 'test-image-id'
  }),
  deleteImage: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../utils/googleMapsClient', () => ({
  geocode: jest.fn().mockResolvedValue({
    lat: 51.5074,
    lng: -0.1276,
    formatted_address: 'London, UK'
  })
}));
```

### 2. Database Mock Issues
**Issue**: Database operations not being mocked properly
**Error**: Tests hitting real database

**Fix**: Mock database operations when needed:
```javascript
// Mock Mongoose operations
jest.mock('../models/user.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

// Mock specific operations
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com'
};

User.findOne.mockResolvedValue(mockUser);
User.create.mockResolvedValue(mockUser);
```

### 3. Time and Date Mocking
**Issue**: Tests failing due to time-dependent logic
**Error**: Inconsistent test results based on timing

**Fix**: Mock time and date functions:
```javascript
// Mock Date.now()
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

// Mock setTimeout and setInterval
jest.useFakeTimers();

// Advance timers in tests
jest.advanceTimersByTime(1000);

// Restore real timers
jest.useRealTimers();
```

---

## Jest Configuration Issues

### 1. Test Timeout Issues
**Issue**: Tests timing out
**Error**: `Timeout - Async callback was not invoked within the 5000ms timeout`

**Fix**: Increase timeout in Jest config and handle async operations:
```javascript
// jest.config.js
module.exports = {
  testTimeout: 10000, // 10 seconds
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

// Handle async operations properly
it('should handle async operations', async () => {
  // Use proper async/await
  const result = await someAsyncOperation();
  expect(result).toBeDefined();
}, 15000); // Override timeout for specific test
```

### 2. Coverage Issues
**Issue**: Coverage not being generated properly
**Error**: Missing coverage reports

**Fix**: Proper coverage configuration:
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/jest.setup.js'
  ]
};
```

### 3. Module Resolution Issues
**Issue**: Tests can't resolve modules
**Error**: `Cannot resolve module`

**Fix**: Configure module resolution:
```javascript
// jest.config.js
module.exports = {
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
};
```

---

## Notes Backend Specific Issues

### 1. Persistent Schema Validation Errors in Tests
**Issue**: Tests failing with `ValidationError: Apartment validation failed: owner: Path 'owner' is required`
**Error**: Occurs when creating notes that reference apartments without proper ownership

**Root Cause**: 
- Tests creating apartments directly without the required `owner` field
- Database cleanup between tests affecting apartment references
- Tests relying on shared apartment objects that may be cleaned up

**Fix**: Always create apartments with proper ownership in tests:
```javascript
// ✅ CORRECT: Create apartment with owner
const createTestApartment = async (userId) => {
  return await Apartment.create({
    title: 'Test Apartment',
    description: 'A test apartment',
    price: 1000,
    location: {
      type: 'Point',
      coordinates: [-0.1276, 51.5074],
      address: {
        street: '123 Test Street',
        city: 'London',
        state: 'England',
        zipCode: 'SW1A 1AA',
        country: 'UK',
      },
    },
    bedrooms: 2,
    bathrooms: 1,
    area: 800,
    owner: userId, // ✅ ALWAYS include owner
    isPublic: true,
  });
};

// ✅ CORRECT: Use in tests
beforeEach(async () => {
  const apartment = await createTestApartment(testUser._id);
  await Note.create({
    user: testUser._id,
    apartment: apartment._id, // Use the created apartment's ID
    title: 'Test Note',
    content: 'Test content',
  });
});
```

**Prevention**: 
- Never create apartments without the `owner` field, even in validation tests
- Always use helper functions that ensure all required fields are provided
- Create fresh apartments for each test rather than relying on shared objects

### 2. Test Data Isolation Issues
**Issue**: Tests affecting each other due to shared database state
**Error**: Inconsistent test results, data conflicts

**Fix**: Ensure proper test isolation:
```javascript
// ✅ CORRECT: Each test creates its own data
describe('Notes API', () => {
  beforeEach(async () => {
    // Create fresh user and apartment for each test
    const { userId, token } = await registerAndLoginUser();
    testUser = { _id: userId };
    authToken = token;
    testApartment = await createTestApartment(userId);
  });

  afterEach(async () => {
    // Clean up is handled by the test setup
  });
});
```

### 3. Authentication Token Issues in Tests
**Issue**: Tests failing due to invalid JWT tokens
**Error**: 401 Unauthorized errors in tests

**Fix**: Use API endpoints for user creation and authentication in tests:
```javascript
// ✅ CORRECT: Register and login via API
const registerAndLoginUser = async (email = 'testuser@example.com') => {
  // Register via API (ensures password hashing)
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email,
      password: 'password123',
    });
  
  // Login via API (ensures valid token)
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password: 'password123',
    });
  
  return {
    userId: loginResponse.body._id,
    token: loginResponse.body.token,
  };
};
```

**Prevention**: 
- Always use API endpoints for user creation in tests
- Never create users directly in database (bypasses password hashing)
- Use the same authentication flow as production

### 4. Missing Required Fields in Test Data
**Issue**: Tests creating documents without all required fields
**Error**: Mongoose validation errors

**Fix**: Always provide all required fields, even in edge case tests:
```javascript
// ✅ CORRECT: Even validation tests need valid data
it('should validate required fields', async () => {
  // Create a valid apartment first
  const validApartment = await createTestApartment(testUser._id);
  
  const response = await request(app)
    .post('/api/notes')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ apartmentId: validApartment._id }); // Only omit note fields

  expect(response.status).toBe(400);
  expect(response.body.errors).toContain('Note title is required');
  expect(response.body.errors).toContain('Note content is required');
});
```

### 5. Test Setup Function Issues
**Issue**: Test helper functions not properly exported or imported
**Error**: `ReferenceError: setupTestDB is not a function`

**Fix**: Ensure proper test setup:
```javascript
// ✅ CORRECT: Use require instead of destructuring
require('./setup'); // This runs the setup hooks

// ❌ INCORRECT: Don't try to destructure non-existent exports
const { setupTestDB } = require('./setup'); // setupTestDB doesn't exist
```

**Prevention**: 
- Check what's actually exported from setup files
- Use `require('./setup')` to run setup hooks
- Don't assume helper functions exist without checking

---

## Performance Testing Issues

### 1. Slow Test Execution
**Issue**: Test suite taking too long to run
**Error**: CI/CD timeouts, slow development feedback

**Fix**: Optimize test performance:
```javascript
// Use parallel test execution
// jest.config.js
module.exports = {
  maxWorkers: '50%', // Use 50% of available cores
  testMatch: ['**/__tests__/**/*.test.js'],
};

// Use test data factories for faster setup
const createBulkTestData = async (count = 10) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(createTestUser({ email: `user${i}@example.com` }));
  }
  return await User.insertMany(users);
};
```

### 2. Memory Leaks in Tests
**Issue**: Tests consuming too much memory
**Error**: Out of memory errors, slow performance

**Fix**: Prevent memory leaks:
```javascript
// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear timers
  jest.clearAllTimers();
  
  // Clean up database
  await cleanupDatabase();
});

// Use weak references for large objects
const testData = new WeakMap();
```

---

## Integration Testing Issues

### 1. API Integration Test Issues
**Issue**: Integration tests failing due to API changes
**Error**: Tests not reflecting actual API behavior

**Fix**: Proper API integration testing:
```javascript
// Test complete API workflows
describe('Complete User Workflow', () => {
  it('should handle user registration to apartment creation', async () => {
    // 1. Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(createTestUser());
    
    expect(registerResponse.status).toBe(201);
    
    // 2. Login user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: registerResponse.body.email,
        password: 'password123'
      });
    
    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;
    
    // 3. Create apartment
    const apartmentResponse = await request(app)
      .post('/api/apartments')
      .set('Authorization', `Bearer ${token}`)
      .send(createTestApartment(loginResponse.body._id));
    
    expect(apartmentResponse.status).toBe(201);
    
    // 4. Create note for apartment
    const noteResponse = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        apartmentId: apartmentResponse.body._id,
        title: 'Test Note',
        content: 'Test content'
      });
    
    expect(noteResponse.status).toBe(201);
  });
});
```

### 2. Database Integration Issues
**Issue**: Tests not properly testing database interactions
**Error**: Tests passing but production failing

**Fix**: Test actual database operations:
```javascript
// Test actual database operations
it('should persist data correctly', async () => {
  const userData = createTestUser();
  const user = await User.create(userData);
  
  // Verify data was actually saved
  const savedUser = await User.findById(user._id);
  expect(savedUser).toBeDefined();
  expect(savedUser.email).toBe(userData.email);
  
  // Test relationships
  const apartment = await Apartment.create(createTestApartment(user._id));
  expect(apartment.owner.toString()).toBe(user._id.toString());
});
```

---

## Quick Reference

### Common Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- note.test.js

# Run tests in watch mode
npm test -- --watch

# Clear test cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Run tests in parallel
npm test -- --maxWorkers=4

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

### Common Error Messages
- `ValidationError: owner: Path 'owner' is required`: Missing required field in test data
- `TypeError: asyncHandler is not a function`: Missing utility function
- `ReferenceError: setupTestDB is not a function`: Incorrect test setup import
- `401 Unauthorized`: Authentication token issues in tests
- `Timeout - Async callback was not invoked`: Test timeout - increase timeout
- `MongoNetworkError`: Database connection issue
- `Cannot resolve module`: Module resolution issue
- `Jest did not exit`: Memory leak or hanging async operations

### Emergency Procedures
1. **Tests Failing**
   - Check test database connection
   - Verify test environment variables
   - Review test data setup
   - Check for test isolation problems
   - Clear test cache

2. **Authentication Issues in Tests**
   - Use API endpoints for user creation
   - Ensure proper token generation
   - Check JWT secret configuration
   - Verify authentication middleware

3. **Database Issues in Tests**
   - Check test database connection
   - Verify database cleanup
   - Check for data isolation problems
   - Review schema validation

4. **Performance Issues**
   - Run tests in parallel
   - Use test data factories
   - Optimize database operations
   - Clear test cache

### Test Best Practices
1. **Always use descriptive test names** that explain what is being tested
2. **Follow the AAA pattern**: Arrange, Act, Assert
3. **Test one thing at a time** - each test should have a single responsibility
4. **Use test data factories** for consistent, reusable test data
5. **Clean up after each test** to ensure test isolation
6. **Mock external dependencies** to avoid network calls and external service issues
7. **Test both success and failure cases** for comprehensive coverage
8. **Use proper assertions** with meaningful error messages
9. **Keep tests fast** by optimizing database operations and using mocks
10. **Document complex test scenarios** with comments explaining the test setup

---

*Last Updated: December 2024*
*Part of the Apartment Search Project Troubleshooting Suite* 