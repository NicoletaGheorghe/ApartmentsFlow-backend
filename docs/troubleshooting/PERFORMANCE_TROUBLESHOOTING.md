# Performance Troubleshooting Guide

## Table of Contents
1. [Performance Monitoring Issues](#performance-monitoring-issues)
2. [Caching Problems](#caching-problems)
3. [Database Performance Issues](#database-performance-issues)
4. [Memory Leaks and Optimization](#memory-leaks-and-optimization)
5. [Load Testing Issues](#load-testing-issues)
6. [Response Time Optimization](#response-time-optimization)
7. [API Performance Issues](#api-performance-issues)
8. [Quick Reference](#quick-reference)

---

## Performance Monitoring Issues

### 1. Performance Metrics Not Available
**Issue**: Performance endpoints not returning data
**Error**: 404 errors or empty responses from `/api/performance`

**Fix**: Check performance monitoring setup:
```javascript
// Ensure performance monitoring is enabled
if (process.env.NODE_ENV !== 'test') {
  app.get('/api/performance', getPerformanceMetrics);
  app.get('/api/cache/stats', (req, res) => {
    res.json(cacheManager.getStats());
  });
}

// Check if middleware is properly applied
app.use(performanceMonitor);
app.use(cachePerformanceMonitor);
```

### 2. Performance Data Not Being Collected
**Issue**: No performance metrics being logged
**Error**: Empty performance data, no response time headers

**Fix**: Verify performance monitoring middleware:
```javascript
// Check performance middleware configuration
const performanceMonitor = (req, res, next) => {
  // Skip performance monitoring in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const start = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Add performance data to response headers
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const responseTime = Number(end - start) / 1000000;
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    res.setHeader('X-Memory-Usage', `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  });

  next();
};
```

### 3. Performance Monitoring Script Issues
**Issue**: Performance monitoring script not working
**Error**: Script errors or no data collection

**Fix**: Check performance monitoring script:
```bash
# Run performance monitoring
npm run performance:monitor

# Check script configuration
node scripts/performance-monitor.js

# Verify API endpoints are accessible
curl http://localhost:3001/api/performance
curl http://localhost:3001/api/cache/stats
```

---

## Caching Problems

### 1. Low Cache Hit Rate
**Issue**: Cache hit rate below 80%
**Error**: Poor performance, high database load

**Fix**: Optimize caching strategy:
```javascript
// Check cache configuration
const cacheConfig = {
  // Optimize TTL based on data type
  apartmentList: 300,      // 5 minutes for apartment lists
  apartmentDetail: 600,    // 10 minutes for apartment details
  userProfile: 1800,       // 30 minutes for user profiles
  staticData: 3600,        // 1 hour for static data
};

// Implement smart cache invalidation
const invalidateRelatedCache = (apartmentId) => {
  cacheManager.del(`apartment:${apartmentId}`);
  cacheManager.del('apartment:list');
  cacheManager.del('apartment:search');
};
```

### 2. Cache Memory Issues
**Issue**: Cache consuming too much memory
**Error**: Memory spikes, cache eviction

**Fix**: Optimize cache memory usage:
```javascript
// Configure cache size limits
const cacheManager = require('../config/cache');

// Set memory limits
cacheManager.setMaxSize(100 * 1024 * 1024); // 100MB limit

// Implement LRU eviction
cacheManager.setEvictionPolicy('lru');

// Monitor cache memory usage
const stats = cacheManager.getStats();
console.log(`Cache memory usage: ${stats.memoryUsage}MB`);
```

### 3. Cache Invalidation Issues
**Issue**: Stale data being served from cache
**Error**: Inconsistent data, outdated information

**Fix**: Implement proper cache invalidation:
```javascript
// Cache invalidation patterns
const invalidateCache = {
  // Invalidate apartment cache when updated
  apartmentUpdated: (apartmentId) => {
    cacheManager.del(`apartment:${apartmentId}`);
    cacheManager.del('apartment:list');
  },

  // Invalidate user cache when profile updated
  userUpdated: (userId) => {
    cacheManager.del(`user:${userId}`);
    cacheManager.del(`user:profile:${userId}`);
  },

  // Invalidate search cache when new apartment added
  apartmentCreated: () => {
    cacheManager.del('apartment:search:*');
    cacheManager.del('apartment:list');
  }
};
```

---

## Database Performance Issues

### 1. Slow Database Queries
**Issue**: Database queries taking too long
**Error**: Response times > 100ms, database timeouts

**Fix**: Optimize database queries:
```javascript
// Use lean() for read-only operations
const apartments = await Apartment.find()
  .lean()
  .select('title price location bedrooms bathrooms')
  .limit(20);

// Use indexes for common queries
apartmentSchema.index({ price: 1, bedrooms: 1 });
apartmentSchema.index({ location: '2dsphere' });
apartmentSchema.index({ owner: 1, isPublic: 1 });

// Use aggregation for complex queries
const stats = await Apartment.aggregate([
  { $match: { isPublic: true } },
  { $group: { 
    _id: '$location.city', 
    avgPrice: { $avg: '$price' },
    count: { $sum: 1 }
  }}
]);
```

### 2. Database Connection Issues
**Issue**: Database connection pool exhausted
**Error**: Connection timeouts, pool errors

**Fix**: Optimize database connections:
```javascript
// Configure connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});

// Monitor connection health
mongoose.connection.on('connected', () => {
  console.log('Database connected');
});

mongoose.connection.on('error', (err) => {
  console.error('Database connection error:', err);
});
```

### 3. Query Optimization Issues
**Issue**: Inefficient queries causing performance problems
**Error**: High CPU usage, slow response times

**Fix**: Implement query optimization:
```javascript
// Use projection to limit fields
const apartments = await Apartment.find()
  .select('title price location bedrooms bathrooms')
  .lean();

// Use pagination for large datasets
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const apartments = await Apartment.find()
  .skip(skip)
  .limit(limit)
  .lean();

// Use compound queries efficiently
const apartments = await Apartment.find({
  price: { $gte: minPrice, $lte: maxPrice },
  bedrooms: { $gte: minBedrooms },
  isPublic: true
}).lean();
```

---

## Memory Leaks and Optimization

### 1. Memory Leaks in Application
**Issue**: Memory usage increasing over time
**Error**: Out of memory errors, application crashes

**Fix**: Implement memory leak detection:
```javascript
// Monitor memory usage
const memoryMonitor = (req, res, next) => {
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
    
    // Alert on memory spikes
    if (memoryDiff > 50 * 1024 * 1024) { // 50MB
      console.warn(`Memory spike detected: +${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
    }
  });
  
  next();
};

// Use garbage collection monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`Memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
}, 300000); // Every 5 minutes
```

### 2. Memory Optimization Issues
**Issue**: High memory usage affecting performance
**Error**: Slow response times, memory pressure

**Fix**: Implement memory optimization:
```javascript
// Optimize object creation
const createOptimizedObject = (data) => {
  // Use object destructuring for efficiency
  const { title, price, location } = data;
  return { title, price, location };
};

// Use streaming for large datasets
const streamLargeDataset = async (req, res) => {
  const cursor = Apartment.find().cursor();
  
  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  
  let first = true;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    if (!first) res.write(',');
    res.write(JSON.stringify(doc));
    first = false;
  }
  
  res.write(']');
  res.end();
};
```

---

## Load Testing Issues

### 1. Load Testing Configuration Problems
**Issue**: Artillery load tests failing or not running
**Error**: Test failures, configuration errors

**Fix**: Configure load testing properly:
```yaml
# artillery.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "API Endpoints"
    weight: 70
    requests:
      - get:
          url: "/api/apartments"
      - get:
          url: "/api/apartments/{{ $randomString() }}"
      - post:
          url: "/api/apartments"
          json:
            title: "Test Apartment"
            price: 1000
```

### 2. Load Testing Performance Issues
**Issue**: Application not handling load properly
**Error**: High error rates, timeouts under load

**Fix**: Optimize for load:
```javascript
// Implement rate limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);

// Use connection pooling
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'user',
  password: 'password',
  database: 'database'
});
```

---

## Response Time Optimization

### 1. Slow API Response Times
**Issue**: API endpoints taking too long to respond
**Error**: Response times > 500ms

**Fix**: Optimize response times:
```javascript
// Implement response caching
const cacheResponse = (duration) => {
  return (req, res, next) => {
    const key = `response:${req.originalUrl}`;
    const cached = cacheManager.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cacheManager.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};

// Use for read-only endpoints
app.get('/api/apartments', cacheResponse(300), getApartments);
```

### 2. Database Query Optimization
**Issue**: Database queries causing slow responses
**Error**: Database bottlenecks

**Fix**: Optimize database queries:
```javascript
// Use database indexes
apartmentSchema.index({ price: 1, bedrooms: 1, isPublic: 1 });

// Use lean queries for read operations
const apartments = await Apartment.find({ isPublic: true })
  .lean()
  .select('title price location')
  .limit(20);

// Use aggregation for complex queries
const stats = await Apartment.aggregate([
  { $match: { isPublic: true } },
  { $group: { 
    _id: null, 
    avgPrice: { $avg: '$price' },
    totalCount: { $sum: 1 }
  }}
]);
```

---

## API Performance Issues

### 1. API Endpoint Performance Problems
**Issue**: Specific endpoints performing poorly
**Error**: Slow response times for certain endpoints

**Fix**: Optimize endpoint performance:
```javascript
// Implement endpoint-specific optimization
const optimizeApartmentList = async (req, res) => {
  const { page = 1, limit = 20, minPrice, maxPrice } = req.query;
  
  // Build efficient query
  const query = { isPublic: true };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }
  
  // Use efficient pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [apartments, total] = await Promise.all([
    Apartment.find(query)
      .lean()
      .select('title price location bedrooms bathrooms')
      .skip(skip)
      .limit(parseInt(limit)),
    Apartment.countDocuments(query)
  ]);
  
  res.json({
    apartments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};
```

### 2. File Upload Performance Issues
**Issue**: File uploads taking too long
**Error**: Upload timeouts, slow processing

**Fix**: Optimize file uploads:
```javascript
// Optimize multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 8
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Use streaming for large files
const processLargeFile = (file) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    file.stream.on('data', chunk => chunks.push(chunk));
    file.stream.on('end', () => resolve(Buffer.concat(chunks)));
    file.stream.on('error', reject);
  });
};
```

---

## Quick Reference

### Common Commands
```bash
# Performance monitoring
npm run performance:monitor    # Start monitoring
npm run load:test             # Run load tests
npm run memory:profile        # Memory profiling

# Cache management
curl http://localhost:3001/api/cache/stats    # Check cache stats
curl -X POST http://localhost:3001/api/cache/flush  # Flush cache

# Performance metrics
curl http://localhost:3001/api/performance    # Get performance metrics
```

### Performance Targets
- **GET requests**: < 200ms (with caching)
- **POST requests**: < 500ms (with validation)
- **File uploads**: < 2s (with optimization)
- **Database queries**: < 100ms (with indexes)
- **Cache hit rate**: > 80% for read operations
- **Memory usage**: < 100MB for cache storage

### Common Error Messages
- `Low cache hit rate`: Cache optimization needed
- `Memory spike detected`: Memory leak investigation required
- `Slow request detected`: Query optimization needed
- `Connection pool exhausted`: Database connection optimization
- `Cache memory limit exceeded`: Cache size optimization

### Emergency Procedures
1. **Performance Degradation**
   - Check cache hit rates
   - Monitor memory usage
   - Review database queries
   - Check for memory leaks

2. **High Response Times**
   - Enable response caching
   - Optimize database queries
   - Check for N+1 queries
   - Review indexing strategy

3. **Memory Issues**
   - Monitor memory usage
   - Check for memory leaks
   - Optimize object creation
   - Review caching strategy

---

*Last Updated: December 2024*
*Part of the Apartment Search Project Troubleshooting Suite* 