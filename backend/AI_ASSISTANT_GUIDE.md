# 🤖 AI Assistant Guide - Apartment Flow Backend

## **QUICK START FOR AI ASSISTANTS**

### **🚀 First Steps**
1. **Read `CODEBASE_SUMMARY.md`** - Get the big picture
2. **Check `src/app.js`** - Understand the main application structure
3. **Review index files** - Use simplified imports from `index.js` files
4. **Check performance endpoints** - Monitor system health

### **🔍 Key Files for AI Processing**
- **`src/app.js`** - Main application with AI-optimized comments
- **`src/config/database.js`** - Database optimization
- **`src/config/cache.js`** - Caching system
- **`src/middleware/performance.middleware.js`** - Performance monitoring
- **`CODEBASE_SUMMARY.md`** - Quick reference guide

---

## **🧠 AI PROCESSING OPTIMIZATIONS**

### **1. Use Index Files for Clean Imports**
```javascript
// ❌ Avoid complex paths
const userController = require('./controllers/user.controller');

// ✅ Use simplified imports
const { user } = require('./controllers');
```

### **2. Follow Naming Conventions**
- **Controllers**: `*.controller.js`
- **Models**: `*.model.js`
- **Routes**: `*.routes.js`
- **Middleware**: `*.middleware.js`

### **3. Look for AI-Optimized Comments**
- `// AI-OPTIMIZED:` - AI-friendly code sections
- `// IMPORTANT:` - Critical logic
- `// TODO:` - Future improvements
- `// SLOW:` - Performance bottlenecks

### **4. Use Performance Endpoints**
- `/api/performance` - Real-time metrics
- `/api/cache/stats` - Cache statistics
- `/api/cache/flush` - Cache management

---

## **🔧 COMMON PATTERNS**

### **Error Handling**
```javascript
// AI-OPTIMIZED: Consistent error response format
res.status(400).json({
  error: 'Error Type',
  details: 'Specific error message'
});
```

### **Authentication**
```javascript
// AI-OPTIMIZED: JWT-based authentication
const { protect, authorize } = require('../middleware/auth.middleware');
router.get('/', protect, authorize('admin'), controllerFunction);
```

### **Validation**
```javascript
// AI-OPTIMIZED: Input validation middleware
const { validateApartmentQuery } = require('../middleware/validation.middleware');
router.get('/', validateApartmentQuery, controllerFunction);
```

### **File Uploads**
```javascript
// AI-OPTIMIZED: Cloudinary integration with fallbacks
const upload = require('../middleware/upload');
router.post('/', upload.array('images', 4), controllerFunction);
```

---

## **⚡ PERFORMANCE CONSIDERATIONS**

### **Database Queries**
- Use `.lean()` for read-only queries
- Leverage compound indexes
- Check cache before database calls
- Monitor query performance

### **Caching Strategy**
- **Apartment listings**: 5 minutes TTL
- **Commute data**: 10 minutes TTL
- **User data**: No caching (security)
- **Authentication**: No caching (security)

### **Memory Management**
- Monitor heap usage
- Check for memory leaks
- Use performance monitoring
- Optimize file uploads

---

## **🧪 TESTING STRATEGY**

### **Test Structure**
- **Unit tests**: Individual functions
- **Integration tests**: API endpoints
- **Performance tests**: Load testing

### **Mocking Strategy**
- **Cloudinary**: Complete mock
- **MongoDB**: In-memory database
- **External APIs**: Axios mocking

### **Test Commands**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run performance:test # Performance tests
```

---

## **🔍 DEBUGGING TIPS**

### **Performance Issues**
1. Check `/api/performance` endpoint
2. Monitor cache hit rates
3. Look for slow queries in logs
4. Check memory usage

### **Authentication Issues**
1. Verify JWT token format
2. Check user roles and permissions
3. Validate middleware order
4. Check rate limiting

### **File Upload Issues**
1. Verify Cloudinary configuration
2. Check file size limits
3. Validate file types
4. Monitor upload performance

---

## **📊 MONITORING ENDPOINTS**

### **Performance Metrics**
```bash
GET /api/performance
# Returns: response times, memory usage, cache stats
```

### **Cache Statistics**
```bash
GET /api/cache/stats
# Returns: hit rate, memory usage, key count
```

### **Cache Management**
```bash
POST /api/cache/flush
# Flushes all cache data
```

---

## **🚀 OPTIMIZATION COMMANDS**

### **Performance Monitoring**
```bash
npm run performance:monitor  # Start monitoring
npm run load:test           # Run load tests
npm run memory:profile      # Memory profiling
npm run db:optimize         # Database optimization
```

### **Development**
```bash
npm run dev                 # Development server
npm run lint               # Code linting
npm run format             # Code formatting
npm test                   # Run tests
```

---

## **⚠️ COMMON PITFALLS**

### **1. Test Environment**
- Performance middleware is disabled in tests
- Caching is disabled in tests
- Use in-memory MongoDB for tests

### **2. File Paths**
- Use relative paths from `src/`
- Leverage index files for imports
- Follow naming conventions

### **3. Error Handling**
- Always include error details in development
- Use consistent error response format
- Handle async errors properly

### **4. Performance**
- Monitor response times
- Check cache hit rates
- Optimize database queries
- Use appropriate TTL values

---

## **📚 ADDITIONAL RESOURCES**

### **Documentation**
- `API_DOCS.md` - API documentation
- `PROJECT_TASKS.md` - Project tasks
- `README.md` - General information

### **Configuration**
- `.env` - Environment variables
- `package.json` - Dependencies and scripts
- `jest.config.js` - Test configuration

### **Performance**
- `Optimising Processing Speed.md` - Performance guide
- `scripts/load-test.yml` - Load testing config
- `scripts/performance-monitor.js` - Monitoring script

---

**This guide is specifically optimized for AI assistant processing speed and efficiency. Use it as your primary reference when working with this codebase.** 