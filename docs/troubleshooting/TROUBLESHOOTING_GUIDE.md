# Troubleshooting Guide - Apartment Search Project

## Table of Contents
1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Integration Issues](#integration-issues)
4. [Database Issues](#database-issues)
5. [Authentication Issues](#authentication-issues)
6. [File Upload Issues](#file-upload-issues)
7. [Performance Issues](#performance-issues)
8. [Common Development Issues](#common-development-issues)
9. [Next.js Specific Issues](#nextjs-specific-issues)
10. [Express.js Specific Issues](#expressjs-specific-issues)
11. [MongoDB Specific Issues](#mongodb-specific-issues)
12. [Deployment Issues](#deployment-issues)
13. [Security Issues](#security-issues)
14. [Testing Issues](#testing-issues)
15. [Prevention Strategies](#prevention-strategies)
16. [Advanced Debugging](#advanced-debugging)

---

## Backend Issues

### 1. Schema Mismatch - Location Field
**Issue**: Backend apartment model expected `location` as string, frontend sent GeoJSON object
**Error**: `"location.trim is not a function"`
**Root Cause**: Schema mismatch between frontend data format and backend expectations

**Fix**:
```javascript
// Before: location: String
// After: 
location: {
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  },
  address: {
    type: String,
    required: true
  }
}
```

**Prevention**: Always validate schema matches frontend data structure before deployment

### 2. Port Conflicts
**Issue**: Backend can't start due to port being in use
**Error**: `EADDRINUSE: address already in use :::3001`

**Fix**:
```bash
# Windows Command Prompt (not Git Bash)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use the force restart script
npm run dev:force
```

**Prevention**: Add `dev:force` script to package.json:
```json
"dev:force": "npx kill-port 3001 && npm run dev"
```

### 3. Validation Middleware Type Errors
**Issue**: Validation middleware not properly handling different data types
**Error**: Various validation errors when processing form data

**Fix**: Improved type checking in validation middleware:
```javascript
// Always check if value exists and has expected methods
if (value && typeof value.trim === 'function') {
  return value.trim();
}
```

### 4. CORS Errors
**Issue**: Frontend can't communicate with backend due to CORS restrictions
**Error**: `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Fix**: Ensure CORS middleware is properly configured:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 5. Express Middleware Order Issues
**Issue**: Middleware not executing in correct order
**Error**: Routes not working, authentication failing

**Fix**: Ensure proper middleware order:
```javascript
// 1. Essential middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 2. Logging and monitoring
app.use(morgan('combined'));

// 3. Authentication middleware
app.use('/api', authMiddleware);

// 4. Routes last
app.use('/api', routes);
```

### 6. Async/Await Error Handling
**Issue**: Unhandled promise rejections crashing the server
**Error**: `UnhandledPromiseRejectionWarning`

**Fix**: Implement proper error handling:
```javascript
// Wrap async routes with error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Use in routes
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
}));
```

---

## Frontend Issues

### 1. API Client Format Mismatch
**Issue**: Frontend sending FormData, API client expecting individual arguments
**Error**: API calls failing due to incorrect data format

**Fix**: Updated API client to handle correct data format:
```javascript
// Ensure proper JSON serialization
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});
```

### 2. Google Maps API Issues
**Issue**: Google Maps API integration causing errors
**Error**: API key issues, rate limiting, or service unavailability

**Fix**: Switched to Nominatim for address handling:
```javascript
// Removed react-google-places-autocomplete
// Implemented Nominatim geocoding
const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );
  const data = await response.json();
  return data[0];
};
```

### 3. Form Validation Errors
**Issue**: Price validation and other form field validation errors
**Error**: Frontend validation not matching backend expectations

**Fix**: Align frontend and backend validation rules:
```javascript
// Ensure consistent validation patterns
const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice > 0;
};
```

### 4. React State Management Issues
**Issue**: State not updating properly, components not re-rendering
**Error**: UI not reflecting data changes

**Fix**: Proper state management:
```javascript
// Use functional updates for state
setState(prevState => ({ ...prevState, newValue }));

// Use useEffect for side effects
useEffect(() => {
  // Effect logic
}, [dependencies]);
```

### 5. Next.js Image Optimization Issues
**Issue**: Images not loading or optimizing properly
**Error**: Image loading errors, poor performance

**Fix**: Proper Next.js Image configuration:
```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

### 6. Client-Side Navigation Issues
**Issue**: Navigation not working, page not updating
**Error**: Router errors, stale data

**Fix**: Proper Next.js routing:
```javascript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/new-page');
router.refresh(); // Force refresh
```

---

## Integration Issues

### 1. Network Errors
**Issue**: Frontend showing "Network Error" when trying to connect to backend
**Error**: `Network Error` in browser console

**Fix**: 
1. Restart both frontend and backend servers
2. Check if both servers are running on correct ports
3. Verify CORS configuration
4. Check firewall settings

### 2. Authentication Token Issues
**Issue**: Authentication tokens not being properly passed or validated
**Error**: 401 Unauthorized errors

**Fix**: Ensure proper token handling:
```javascript
// Frontend: Include token in headers
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}

// Backend: Proper token validation
const token = req.headers.authorization?.split(' ')[1];
```

### 3. Data Format Mismatches
**Issue**: Frontend and backend expecting different data structures
**Error**: Various parsing and validation errors

**Fix**: Establish clear API contracts and validate data at both ends

### 4. Environment Variable Mismatches
**Issue**: Different environment variables between frontend and backend
**Error**: API calls failing, configuration errors

**Fix**: Synchronize environment variables:
```javascript
// Backend .env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/apartment_search
JWT_SECRET=your-secret

// Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Database Issues

### 1. MongoDB Connection Issues
**Issue**: Database connection failures
**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Fix**:
1. Check MongoDB service is running
2. Verify connection string
3. Check network connectivity
4. Ensure proper authentication

### 2. Missing Indexes
**Issue**: Slow queries due to missing database indexes
**Error**: Performance degradation on large datasets

**Fix**: Add appropriate indexes:
```javascript
// Geospatial index for location queries
apartmentSchema.index({ location: '2dsphere' });

// Text index for search functionality
apartmentSchema.index({ 
  title: 'text', 
  description: 'text',
  'location.address': 'text'
});

// Compound indexes for common queries
apartmentSchema.index({ price: 1, bedrooms: 1 });
```

### 3. Schema Validation Errors
**Issue**: Data not matching schema requirements
**Error**: Mongoose validation errors

**Fix**: Ensure schema matches data requirements and add proper validation

### 4. MongoDB Memory Issues
**Issue**: High memory usage, slow performance
**Error**: Out of memory errors

**Fix**: Optimize MongoDB configuration:
```javascript
// Add connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 5. Database Lock Issues
**Issue**: Database operations timing out
**Error**: Lock timeout errors

**Fix**: Optimize queries and add proper indexing:
```javascript
// Use lean() for read-only operations
const apartments = await Apartment.find().lean();

// Use select() to limit fields
const apartments = await Apartment.find().select('title price location');
```

---

## Authentication Issues

### 1. JWT Token Expiration
**Issue**: Tokens expiring and causing authentication failures
**Error**: 401 Unauthorized after token expiration

**Fix**: Implement token refresh mechanism:
```javascript
// Check token expiration and refresh if needed
const refreshToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  });
  return response.json();
};
```

### 2. Password Hashing Issues
**Issue**: Password comparison failures
**Error**: Login failures despite correct credentials

**Fix**: Ensure consistent password hashing:
```javascript
// Use bcrypt consistently
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 3. Session Management Issues
**Issue**: Users being logged out unexpectedly
**Error**: Session timeout, token invalidation

**Fix**: Implement proper session management:
```javascript
// Set appropriate token expiration
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

// Implement refresh token rotation
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });
```

---

## File Upload Issues

### 1. File Size Limits
**Issue**: Large files causing upload failures
**Error**: `Payload too large` or timeout errors

**Fix**: Configure proper limits:
```javascript
// Increase file size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### 2. File Type Validation
**Issue**: Invalid file types being uploaded
**Error**: Security vulnerabilities or processing errors

**Fix**: Implement proper file type validation:
```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.mimetype)) {
  throw new Error('Invalid file type');
}
```

### 3. Cloudinary Upload Failures
**Issue**: Image upload to Cloudinary failing
**Error**: Cloudinary API errors

**Fix**: 
1. Check Cloudinary credentials
2. Verify file format compatibility
3. Handle upload errors gracefully

### 4. File Storage Issues
**Issue**: Files not being stored properly
**Error**: Missing files, storage errors

**Fix**: Implement proper file storage:
```javascript
// Use multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});
```

---

## Performance Issues

### 1. Slow API Responses
**Issue**: API endpoints taking too long to respond
**Error**: Timeout errors or poor user experience

**Fix**:
1. Add database indexes
2. Implement caching
3. Optimize queries
4. Add pagination

### 2. Memory Leaks
**Issue**: Application memory usage increasing over time
**Error**: Application crashes or slowdowns

**Fix**:
1. Properly close database connections
2. Clear intervals and timeouts
3. Monitor memory usage
4. Implement proper cleanup

### 3. Frontend Performance Issues
**Issue**: Slow page loads, poor user experience
**Error**: High bundle sizes, slow rendering

**Fix**: Optimize Next.js performance:
```javascript
// Use dynamic imports
const DynamicComponent = dynamic(() => import('./Component'));

// Implement proper caching
export const revalidate = 3600; // Revalidate every hour
```

---

## Next.js Specific Issues

### 1. Build Errors
**Issue**: Next.js build failing
**Error**: Various build-time errors

**Fix**: Common build fixes:
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### 2. API Route Issues
**Issue**: API routes not working properly
**Error**: 404 errors, routing issues

**Fix**: Proper API route structure:
```javascript
// pages/api/example.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Handle POST
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

### 3. Environment Variable Issues
**Issue**: Environment variables not accessible
**Error**: Undefined variables

**Fix**: Proper environment variable usage:
```javascript
// Server-side only
const secret = process.env.SECRET_KEY;

// Client-side accessible
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

---

## Express.js Specific Issues

### 1. Route Conflicts
**Issue**: Routes not matching expected patterns
**Error**: 404 errors, wrong handlers

**Fix**: Proper route ordering:
```javascript
// Specific routes first
app.get('/api/users/:id', getUserById);

// General routes last
app.get('/api/users', getAllUsers);
```

### 2. Middleware Issues
**Issue**: Middleware not executing properly
**Error**: Authentication failures, CORS issues

**Fix**: Proper middleware setup:
```javascript
// Order matters!
app.use(express.json());
app.use(cors());
app.use('/api', authMiddleware);
app.use('/api', routes);
```

### 3. Error Handling
**Issue**: Errors not being caught properly
**Error**: Unhandled exceptions, server crashes

**Fix**: Implement error handling middleware:
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
```

---

## MongoDB Specific Issues

### 1. Connection String Issues
**Issue**: Invalid connection strings
**Error**: Connection failures

**Fix**: Proper connection string format:
```javascript
// Local development
mongodb://localhost:27017/database_name

// Atlas
mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### 2. Query Performance Issues
**Issue**: Slow database queries
**Error**: Timeout errors, poor performance

**Fix**: Optimize queries:
```javascript
// Use projection to limit fields
const users = await User.find({}, 'name email');

// Use lean() for read-only operations
const users = await User.find().lean();

// Add proper indexes
userSchema.index({ email: 1 });
```

### 3. Aggregation Pipeline Issues
**Issue**: Complex aggregation queries failing
**Error**: Pipeline errors, incorrect results

**Fix**: Proper aggregation syntax:
```javascript
const result = await Apartment.aggregate([
  { $match: { price: { $gte: 1000 } } },
  { $group: { _id: '$location.city', avgPrice: { $avg: '$price' } } }
]);
```

---

## Deployment Issues

### 1. Environment Variable Issues
**Issue**: Missing environment variables in production
**Error**: Configuration errors

**Fix**: Proper environment variable management:
```bash
# Set production environment variables
export NODE_ENV=production
export PORT=3000
export MONGODB_URI=your_production_uri
```

### 2. Build Failures
**Issue**: Production builds failing
**Error**: Various build errors

**Fix**: Check build process:
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

### 3. Port Issues
**Issue**: Application not starting on expected port
**Error**: Port already in use

**Fix**: Proper port configuration:
```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

---

## Security Issues

### 1. SQL Injection (MongoDB)
**Issue**: Malicious input in queries
**Error**: Data breaches, unauthorized access

**Fix**: Use parameterized queries:
```javascript
// Use Mongoose to prevent injection
const user = await User.findOne({ email: email });

// Avoid string concatenation
// BAD: User.find({ email: "' OR 1=1 --" })
```

### 2. XSS Attacks
**Issue**: Malicious scripts in user input
**Error**: Security vulnerabilities

**Fix**: Sanitize user input:
```javascript
// Use helmet middleware
app.use(helmet());

// Sanitize HTML input
const sanitizeHtml = require('sanitize-html');
const clean = sanitizeHtml(dirty);
```

### 3. CORS Misconfiguration
**Issue**: Overly permissive CORS settings
**Error**: Security vulnerabilities

**Fix**: Proper CORS configuration:
```javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

---

## Testing Issues

### 1. Test Environment Setup
**Issue**: Tests failing due to environment issues
**Error**: Database connection errors, missing variables

**Fix**: Proper test setup:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000
};
```

### 2. Database Testing Issues
**Issue**: Tests affecting each other
**Error**: Data conflicts, test isolation problems

**Fix**: Proper test isolation:
```javascript
// Use test database
beforeAll(async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});
```

### 3. Mock Issues
**Issue**: Mocks not working properly
**Error**: Tests failing due to external dependencies

**Fix**: Proper mocking:
```javascript
// Mock external services
jest.mock('../utils/emailService', () => ({
  sendEmail: jest.fn()
}));
```

---

## Prevention Strategies

### 1. Development Workflow
- Always test API contracts between frontend and backend
- Use TypeScript for better type safety
- Implement comprehensive error handling
- Add logging for debugging

### 2. Code Quality
- Use ESLint and Prettier for consistent code style
- Implement automated testing
- Use pre-commit hooks for code quality checks
- Regular code reviews

### 3. Monitoring
- Implement application monitoring
- Add performance metrics
- Monitor error rates
- Set up alerts for critical issues

### 4. Documentation
- Keep API documentation updated
- Document schema changes
- Maintain changelog
- Create runbooks for common issues

### 5. Security Best Practices
- Regular security audits
- Keep dependencies updated
- Implement proper authentication
- Use HTTPS in production

---

## Advanced Debugging

### 1. Node.js Debugging
```bash
# Start with debugging enabled
node --inspect app.js

# Use Chrome DevTools for debugging
chrome://inspect
```

### 2. MongoDB Debugging
```bash
# Enable MongoDB query logging
mongoose.set('debug', true);

# Check slow queries
db.getProfilingStatus()
```

### 3. Network Debugging
```bash
# Check network connectivity
curl -v http://localhost:3001/api/health

# Monitor network requests
# Use browser DevTools Network tab
```

### 4. Memory Debugging
```bash
# Check memory usage
node --inspect --expose-gc app.js

# Force garbage collection
global.gc();
```

---

## Quick Reference Commands

### Backend
```bash
# Force restart backend
npm run dev:force

# Kill process on port 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Check backend logs
npm run dev

# Run tests
npm test

# Check for memory leaks
node --inspect app.js
```

### Frontend
```bash
# Start frontend
npm run dev

# Build for production
npm run build

# Check for linting issues
npm run lint

# Analyze bundle size
npm run analyze
```

### Database
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Backup database
mongodump --db apartment_search

# Restore database
mongorestore --db apartment_search

# Check slow queries
db.getProfilingStatus()
```

### General
```bash
# Clear all caches
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update
```

---

## Emergency Procedures

### 1. Backend Won't Start
1. Check port availability
2. Verify environment variables
3. Check database connection
4. Review error logs
5. Clear Node.js cache

### 2. Frontend Can't Connect to Backend
1. Verify both servers are running
2. Check CORS configuration
3. Verify API endpoints
4. Check network connectivity
5. Clear browser cache

### 3. Database Issues
1. Check MongoDB service
2. Verify connection string
3. Check disk space
4. Review database logs
5. Check for locks

### 4. Authentication Problems
1. Check JWT secret
2. Verify token expiration
3. Check user permissions
4. Review authentication middleware
5. Clear user sessions

### 5. Performance Issues
1. Check database indexes
2. Monitor memory usage
3. Review slow queries
4. Check network latency
5. Optimize bundle size

---

## Common Error Messages and Solutions

### Backend Errors
- `EADDRINUSE`: Port already in use → Kill process or change port
- `ECONNREFUSED`: Connection refused → Check service status
- `ENOENT`: File not found → Check file paths
- `EACCES`: Permission denied → Check file permissions

### Frontend Errors
- `Module not found`: Missing dependency → Run `npm install`
- `Cannot read property of undefined`: Null check needed
- `Maximum call stack size exceeded`: Infinite loop or recursion
- `Unexpected token`: Syntax error → Check code syntax

### Database Errors
- `MongoNetworkError`: Network connectivity issue
- `MongoParseError`: Invalid connection string
- `ValidationError`: Schema validation failed
- `CastError`: Invalid data type

---

*Last Updated: December 2024*
*Version: 2.0* 