# Deployment Troubleshooting Guide

## Table of Contents
1. [Environment Variable Issues](#environment-variable-issues)
2. [Build Failures](#build-failures)
3. [Port Conflicts](#port-conflicts)
4. [Production Configuration](#production-configuration)
5. [Performance Optimization](#performance-optimization)
6. [SSL/HTTPS Issues](#sslhttps-issues)
7. [Domain and DNS Issues](#domain-and-dns-issues)
8. [Quick Reference](#quick-reference)

---

## Environment Variable Issues

### 1. Missing Environment Variables
**Issue**: Missing environment variables in production
**Error**: Configuration errors, undefined variables

**Fix**: Set up production environment variables:
```bash
# Backend .env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-production-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Frontend .env.local
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 2. Environment Variable Mismatches
**Issue**: Different environment variables between frontend and backend
**Error**: API calls failing, configuration errors

**Fix**: Synchronize environment variables:
```javascript
// Backend environment check
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

// Frontend environment check
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is required');
}
```

### 3. Sensitive Data Exposure
**Issue**: Sensitive environment variables being exposed
**Error**: Security vulnerabilities

**Fix**: Secure environment variable handling:
```javascript
// Never log sensitive data
console.log('Database connected'); // ✅ Good
console.log('Database URI:', process.env.MONGODB_URI); // ❌ Bad

// Use environment-specific configs
const config = {
  development: {
    database: 'mongodb://localhost:27017/dev_db'
  },
  production: {
    database: process.env.MONGODB_URI
  }
};
```

---

## Build Failures

### 1. Next.js Build Issues
**Issue**: Frontend build failing
**Error**: Various build-time errors

**Fix**: Common build fixes:
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Clear all caches
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### 2. Dependency Issues
**Issue**: Missing or incompatible dependencies
**Error**: Module not found, version conflicts

**Fix**: Resolve dependency issues:
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

### 3. Build Performance Issues
**Issue**: Builds taking too long
**Error**: Timeout errors, slow deployments

**Fix**: Optimize build process:
```javascript
// next.config.mjs
const nextConfig = {
  // Enable build optimization
  swcMinify: true,
  
  // Optimize images
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Reduce bundle size
  experimental: {
    optimizeCss: true,
  }
};
```

---

## Port Conflicts

### 1. Port Already in Use
**Issue**: Application can't start due to port being in use
**Error**: `EADDRINUSE: address already in use :::3001`

**Fix**: Resolve port conflicts:
```bash
# Check what's using the port
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
PORT=3002 npm start
```

### 2. Production Port Configuration
**Issue**: Application not starting on expected port
**Error**: Port already in use

**Fix**: Proper port configuration:
```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### 3. Reverse Proxy Issues
**Issue**: Reverse proxy not forwarding requests correctly
**Error**: 404 errors, routing issues

**Fix**: Configure reverse proxy properly:
```nginx
# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Production Configuration

### 1. Production Database Setup
**Issue**: Production database not configured properly
**Error**: Database connection failures

**Fix**: Set up production database:
```javascript
// Production database configuration
const dbConfig = {
  development: {
    uri: 'mongodb://localhost:27017/dev_db'
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  }
};
```

### 2. Production Security Configuration
**Issue**: Security settings not configured for production
**Error**: Security vulnerabilities

**Fix**: Configure production security:
```javascript
// Production security settings
if (process.env.NODE_ENV === 'production') {
  // Force HTTPS
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });

  // Set security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}
```

### 3. Production Logging
**Issue**: Insufficient logging in production
**Error**: Difficult to debug production issues

**Fix**: Set up production logging:
```javascript
// Production logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## Performance Optimization

### 1. Database Optimization
**Issue**: Slow database queries in production
**Error**: Timeout errors, poor performance

**Fix**: Optimize database for production:
```javascript
// Add production indexes
apartmentSchema.index({ price: 1, bedrooms: 1 });
apartmentSchema.index({ location: '2dsphere' });
apartmentSchema.index({ 
  title: 'text', 
  description: 'text' 
});

// Use connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 2. Caching Implementation
**Issue**: No caching in production
**Error**: Slow response times

**Fix**: Implement caching:
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      next();
    } catch (error) {
      next();
    }
  };
};
```

### 3. Bundle Optimization
**Issue**: Large bundle sizes
**Error**: Slow page loads

**Fix**: Optimize bundle size:
```javascript
// next.config.mjs
const nextConfig = {
  // Enable bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Optimize images
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

---

## SSL/HTTPS Issues

### 1. SSL Certificate Issues
**Issue**: SSL certificate not working properly
**Error**: SSL errors, insecure connections

**Fix**: Configure SSL properly:
```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 2. Mixed Content Issues
**Issue**: HTTP resources on HTTPS pages
**Error**: Mixed content warnings

**Fix**: Ensure all resources use HTTPS:
```javascript
// Use HTTPS for all external resources
const config = {
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Force HTTPS
  }
};
```

---

## Domain and DNS Issues

### 1. Domain Configuration
**Issue**: Domain not pointing to correct server
**Error**: Domain not resolving

**Fix**: Configure domain properly:
```bash
# Check DNS resolution
nslookup your-domain.com

# Check A record
dig your-domain.com A

# Check CNAME record
dig www.your-domain.com CNAME
```

### 2. Subdomain Issues
**Issue**: Subdomains not working
**Error**: Subdomain not resolving

**Fix**: Configure subdomains:
```nginx
# Nginx subdomain configuration
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Quick Reference

### Common Commands
```bash
# Check environment variables
echo $NODE_ENV
echo $PORT

# Check port usage
netstat -ano | findstr :3001

# Check build status
npm run build

# Check for security issues
npm audit

# Check SSL certificate
openssl s_client -connect your-domain.com:443
```

### Common Error Messages
- `EADDRINUSE`: Port already in use → Kill process or change port
- `Build failed`: Build errors → Check dependencies and configuration
- `SSL error`: Certificate issues → Check SSL configuration
- `DNS resolution failed`: Domain issues → Check DNS settings

### Emergency Procedures
1. **Deployment Failures**
   - Check environment variables
   - Verify build process
   - Check port availability
   - Review error logs

2. **Performance Issues**
   - Check database indexes
   - Monitor resource usage
   - Review caching strategy
   - Optimize bundle size

3. **Security Issues**
   - Check SSL configuration
   - Verify environment variables
   - Review security headers
   - Check for vulnerabilities

---

*Last Updated: December 2024*
*Part of the Apartment Search Project Troubleshooting Suite* 