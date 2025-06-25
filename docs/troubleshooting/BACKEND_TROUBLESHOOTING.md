# Backend Troubleshooting Guide

## Table of Contents
1. [Server Startup Issues](#server-startup-issues)
2. [API Endpoint Problems](#api-endpoint-problems)
3. [Middleware Issues](#middleware-issues)
4. [Route Conflicts](#route-conflicts)
5. [Performance Issues](#performance-issues)
6. [File Upload Problems](#file-upload-problems)
7. [Express.js Specific Issues](#expressjs-specific-issues)
8. [Quick Reference](#quick-reference)

---

## Server Startup Issues

### 1. Port Already in Use
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

### 2. Environment Variable Issues
**Issue**: Missing or incorrect environment variables
**Error**: `ReferenceError: process.env.VARIABLE is undefined`

**Fix**: Check `.env` file exists and has correct variables:
```bash
# Required environment variables
PORT=3001
MONGODB_URI=mongodb://localhost:27017/apartment_search
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 3. Database Connection Failures
**Issue**: Can't connect to MongoDB
**Error**: `MongoNetworkError: connect ECONNREFUSED`

**Fix**:
1. Check MongoDB service is running
2. Verify connection string in `.env`
3. Check network connectivity
4. Ensure proper authentication

---

## API Endpoint Problems

### 1. 404 Errors for New Endpoints
**Issue**: New routes not being registered properly
**Error**: 404 errors for new endpoints

**Fix**: Ensure routes are properly imported and registered in app.js:
```javascript
// Import routes
const noteRoutes = require('./routes/note.routes');

// Register routes
app.use('/api/notes', noteRoutes);
```

### 2. Route Conflicts
**Issue**: Routes not matching expected patterns
**Error**: 404 errors, wrong handlers

**Fix**: Proper route ordering:
```javascript
// Specific routes first
app.get('/api/users/:id', getUserById);

// General routes last
app.get('/api/users', getAllUsers);
```

### 3. Request Body Parsing Issues
**Issue**: Request body not being parsed correctly
**Error**: `req.body` is undefined or empty

**Fix**: Ensure proper middleware order:
```javascript
// Essential middleware first
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

---

## Middleware Issues

### 1. CORS Errors
**Issue**: Frontend can't communicate with backend due to CORS restrictions
**Error**: `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Fix**: Ensure CORS middleware is properly configured:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 2. Authentication Middleware Issues
**Issue**: Authentication not working properly
**Error**: 401 Unauthorized errors

**Fix**: Proper middleware setup:
```javascript
// Order matters!
app.use(express.json());
app.use(cors());
app.use('/api', authMiddleware); // Apply to all API routes
app.use('/api', routes);
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

---

## Route Conflicts

### 1. Express Middleware Order Issues
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

### 2. Route Parameter Issues
**Issue**: Route parameters not being captured correctly
**Error**: `req.params` is undefined or incorrect

**Fix**: Proper route parameter definition:
```javascript
// Use :paramName for route parameters
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  // Handle request
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

### 3. Async/Await Error Handling
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

## File Upload Problems

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

## Express.js Specific Issues

### 1. Error Handling
**Issue**: Errors not being caught properly
**Error**: Unhandled exceptions, server crashes

**Fix**: Implement error handling middleware:
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
```

### 2. Missing Utility Functions
**Issue**: Tests failing due to missing utility functions like `asyncHandler`
**Error**: `TypeError: asyncHandler is not a function`

**Fix**: Implement missing utilities in utils/index.js:
```javascript
// Simple asyncHandler utility
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  googleMapsClient,
  asyncHandler,
};
```

### 3. Static File Serving
**Issue**: Static files not being served correctly
**Error**: 404 errors for static assets

**Fix**: Proper static file configuration:
```javascript
// Serve static files
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));
```

---

## Quick Reference

### Common Commands
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

### Common Error Messages
- `EADDRINUSE`: Port already in use → Kill process or change port
- `ECONNREFUSED`: Connection refused → Check service status
- `ENOENT`: File not found → Check file paths
- `EACCES`: Permission denied → Check file permissions

### Emergency Procedures
1. **Backend Won't Start**
   - Check port availability
   - Verify environment variables
   - Check database connection
   - Review error logs
   - Clear Node.js cache

2. **API Endpoints Not Working**
   - Check route registration
   - Verify middleware order
   - Check authentication
   - Review request/response format

3. **Performance Issues**
   - Check database indexes
   - Monitor memory usage
   - Review slow queries
   - Check network latency

---

*Last Updated: December 2024*
*Part of the Apartment Search Project Troubleshooting Suite* 