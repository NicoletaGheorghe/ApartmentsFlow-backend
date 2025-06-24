# Security Troubleshooting Guide

## Table of Contents
1. [Authentication Issues](#authentication-issues)
2. [JWT Token Problems](#jwt-token-problems)
3. [CORS Configuration](#cors-configuration)
4. [File Upload Security](#file-upload-security)
5. [Input Validation](#input-validation)
6. [XSS and Injection Prevention](#xss-and-injection-prevention)
7. [Authorization Issues](#authorization-issues)
8. [Quick Reference](#quick-reference)

---

## Authentication Issues

### 1. Login Failures
**Issue**: Users can't log in despite correct credentials
**Error**: Authentication failures, 401 errors

**Fix**: Check authentication flow:
```javascript
// Ensure proper password comparison
const isValid = await bcrypt.compare(password, user.password);

// Check user exists and is active
const user = await User.findOne({ email, isActive: true });

// Generate proper JWT token
const token = jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### 2. Password Hashing Issues
**Issue**: Password comparison failures
**Error**: Login failures despite correct credentials

**Fix**: Ensure consistent password hashing:
```javascript
// Use bcrypt consistently
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);

// Use same salt rounds
const SALT_ROUNDS = 10;
```

### 3. User Registration Issues
**Issue**: Users can't register or registration fails
**Error**: Validation errors, duplicate user errors

**Fix**: Proper registration validation:
```javascript
// Check for existing user
const existingUser = await User.findOne({ email });
if (existingUser) {
  throw new Error('User already exists');
}

// Validate password strength
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
  throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
}
```

---

## JWT Token Problems

### 1. Token Expiration
**Issue**: Tokens expiring and causing authentication failures
**Error**: 401 Unauthorized after token expiration

**Fix**: Implement token refresh mechanism:
```javascript
// Check token expiration
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const now = Math.floor(Date.now() / 1000);

if (decoded.exp < now) {
  // Token expired, try refresh token
  const refreshToken = req.headers['refresh-token'];
  if (refreshToken) {
    const newToken = await refreshAccessToken(refreshToken);
    res.setHeader('Authorization', `Bearer ${newToken}`);
  }
}

// Refresh token function
const refreshAccessToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  const user = await User.findById(decoded.userId);
  
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
```

### 2. Invalid Token Format
**Issue**: Tokens not being formatted correctly
**Error**: Token parsing errors

**Fix**: Proper token handling:
```javascript
// Extract token from Authorization header
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  throw new Error('Invalid authorization header');
}

const token = authHeader.split(' ')[1];

// Verify token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
} catch (error) {
  throw new Error('Invalid token');
}
```

### 3. Token Security Issues
**Issue**: Tokens being compromised or misused
**Error**: Unauthorized access

**Fix**: Implement token security measures:
```javascript
// Store token in httpOnly cookie
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});

// Implement token blacklisting
const blacklistedTokens = new Set();

const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};
```

---

## CORS Configuration

### 1. CORS Errors
**Issue**: Frontend can't communicate with backend due to CORS restrictions
**Error**: `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Fix**: Proper CORS configuration:
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://yourdomain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### 2. Preflight Request Issues
**Issue**: OPTIONS requests failing
**Error**: CORS preflight failures

**Fix**: Handle preflight requests:
```javascript
// Handle OPTIONS requests
app.options('*', cors(corsOptions));

// Or handle specific routes
app.options('/api/apartments', cors(corsOptions));
```

---

## File Upload Security

### 1. File Type Validation
**Issue**: Invalid file types being uploaded
**Error**: Security vulnerabilities or processing errors

**Fix**: Implement proper file type validation:
```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxSize = 5 * 1024 * 1024; // 5MB

const validateFile = (file) => {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  return true;
};
```

### 2. Malicious File Uploads
**Issue**: Malicious files being uploaded
**Error**: Security vulnerabilities

**Fix**: Implement file scanning:
```javascript
// Use multer with file filtering
const upload = multer({
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: maxSize
  }
});
```

### 3. File Storage Security
**Issue**: Files being stored insecurely
**Error**: Unauthorized file access

**Fix**: Secure file storage:
```javascript
// Use secure file paths
const fileName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.jpg`;

// Store files outside web root
const uploadPath = path.join(__dirname, '../uploads', fileName);

// Set proper file permissions
fs.chmodSync(uploadPath, 0o644);
```

---

## Input Validation

### 1. SQL Injection Prevention
**Issue**: Malicious input in queries
**Error**: Data breaches, unauthorized access

**Fix**: Use parameterized queries:
```javascript
// Use Mongoose to prevent injection
const user = await User.findOne({ email: email });

// Avoid string concatenation
// BAD: User.find({ email: "' OR 1=1 --" })
```

### 2. XSS Prevention
**Issue**: Malicious scripts in user input
**Error**: Security vulnerabilities

**Fix**: Sanitize user input:
```javascript
// Use helmet middleware
app.use(helmet());

// Sanitize HTML input
const sanitizeHtml = require('sanitize-html');
const clean = sanitizeHtml(dirty, {
  allowedTags: ['b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: {
    'a': ['href']
  }
});
```

### 3. Input Sanitization
**Issue**: Malicious input not being sanitized
**Error**: Security vulnerabilities

**Fix**: Implement input sanitization:
```javascript
// Sanitize strings
const sanitizeString = (str) => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000); // Limit length
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

---

## XSS and Injection Prevention

### 1. Content Security Policy
**Issue**: XSS attacks through malicious scripts
**Error**: Security vulnerabilities

**Fix**: Implement CSP:
```javascript
// Set CSP headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}));
```

### 2. NoSQL Injection Prevention
**Issue**: Malicious input in MongoDB queries
**Error**: Unauthorized data access

**Fix**: Validate and sanitize query parameters:
```javascript
// Validate ObjectId
const isValidId = mongoose.Types.ObjectId.isValid(id);
if (!isValidId) {
  throw new Error('Invalid ID format');
}

// Sanitize query parameters
const sanitizeQuery = (query) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim().substring(0, 100);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
```

### 3. Command Injection Prevention
**Issue**: Malicious commands being executed
**Error**: System compromise

**Fix**: Avoid command execution:
```javascript
// Don't use eval or similar functions
// BAD: eval(userInput)

// Use safe alternatives
const safeEval = (expression) => {
  // Use a safe expression evaluator
  return math.evaluate(expression);
};
```

---

## Authorization Issues

### 1. Role-Based Access Control
**Issue**: Users accessing unauthorized resources
**Error**: Unauthorized access

**Fix**: Implement RBAC:
```javascript
// Check user roles
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Use in routes
app.get('/api/admin/users', requireRole('admin'), getUsers);
```

### 2. Resource Ownership
**Issue**: Users accessing other users' resources
**Error**: Unauthorized data access

**Fix**: Check resource ownership:
```javascript
// Check if user owns the resource
const checkOwnership = async (req, res, next) => {
  const apartment = await Apartment.findById(req.params.id);
  
  if (!apartment) {
    return res.status(404).json({ error: 'Apartment not found' });
  }
  
  if (apartment.owner.toString() !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  req.apartment = apartment;
  next();
};
```

### 3. Public/Private Resource Access
**Issue**: Private resources being accessed publicly
**Error**: Unauthorized access

**Fix**: Implement access control:
```javascript
// Check if resource is public or user has access
const checkAccess = async (req, res, next) => {
  const apartment = await Apartment.findById(req.params.id);
  
  if (!apartment) {
    return res.status(404).json({ error: 'Apartment not found' });
  }
  
  // Allow access if public or owner
  if (apartment.isPublic || apartment.owner.toString() === req.user.userId) {
    req.apartment = apartment;
    return next();
  }
  
  return res.status(403).json({ error: 'Not authorized' });
};
```

---

## Quick Reference

### Common Commands
```bash
# Check JWT token
jwt.verify(token, secret)

# Generate secure password hash
bcrypt.hash(password, 10)

# Check file type
file.mimetype

# Validate email
emailRegex.test(email)
```

### Common Error Messages
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `CORS error`: Cross-origin request blocked
- `ValidationError`: Input validation failed

### Emergency Procedures
1. **Authentication Problems**
   - Check JWT secret
   - Verify token expiration
   - Check user permissions
   - Review authentication middleware
   - Clear user sessions

2. **Security Breach**
   - Revoke all tokens
   - Change JWT secret
   - Review access logs
   - Update security measures
   - Notify affected users

3. **File Upload Issues**
   - Check file type validation
   - Verify file size limits
   - Review storage permissions
   - Scan for malicious files

---

*Last Updated: December 2024*
*Part of the Apartment Search Project Troubleshooting Suite* 