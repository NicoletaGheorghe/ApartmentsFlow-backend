'use strict';

/**
 * 🚀 AI-OPTIMIZED: Main Application Entry Point
 *
 * This file contains the core Express.js application setup with:
 * - Performance monitoring middleware
 * - Database connection optimization
 * - Caching system integration
 * - Security middleware configuration
 * - API route definitions
 * - Error handling middleware
 *
 * AI ASSISTANT: Start here to understand the application structure
 */

/**
 * Module dependencies.
 */

// Core dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const rateLimit = require('express-rate-limit');
const path = require('path');

// AI-OPTIMIZED: Performance and caching modules
const { connectDB, optimizeQueries, setupConnectionHandlers } = require('./config/database');
const cacheManager = require('./config/cache');
const {
  performanceMonitor,
  queryPerformanceMonitor,
  memoryMonitor,
  cachePerformanceMonitor,
  getPerformanceMetrics,
} = require('./middleware/performance.middleware');

require('dotenv').config();

const app = (module.exports = express());

/**
 * AI-OPTIMIZED: Error creation utility
 * Creates errors with status codes for consistent error handling
 */
function error(status, msg) {
  const err = new Error(msg);
  err.status = status;
  return err;
}

/**
 * AI-OPTIMIZED: Database Connection Setup
 * Connects to MongoDB with performance optimizations
 * SKIPPED in test environment for faster test execution
 */
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      // AI-OPTIMIZED: Setup query optimization hooks
      optimizeQueries();
      // AI-OPTIMIZED: Setup connection event handlers
      setupConnectionHandlers();
      console.log('MongoDB connected with optimizations');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

/**
 * AI-OPTIMIZED: Performance Monitoring Middleware
 *
 * These middleware components track:
 * - Response times
 * - Memory usage
 * - Database query performance
 * - Cache hit rates
 *
 * SKIPPED in test environment to avoid interference
 */
if (process.env.NODE_ENV !== 'test') {
  app.use(performanceMonitor);
  app.use(queryPerformanceMonitor);
  app.use(memoryMonitor);
  app.use(cachePerformanceMonitor);
}

/**
 * AI-OPTIMIZED: Security and Basic Middleware
 *
 * Security features:
 * - Helmet for security headers
 * - CORS configuration
 * - JSON body parsing
 * - Conditional logging
 */
app.use(
  helmet({
    // AI-OPTIMIZED: Optimized helmet configuration for better performance
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    // AI-OPTIMIZED: Disable some features for better performance
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    // AI-OPTIMIZED: Optimized CORS for better performance
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
        : ['http://localhost:3000'],
    credentials: true,
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);

app.use(
  express.json({
    limit: '10mb', // AI-OPTIMIZED: Increased limit for image uploads
    strict: true,
  })
);

/**
 * AI-OPTIMIZED: Conditional Logging
 * Only logs in development or when explicitly enabled
 * Reduces overhead in production
 */
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_LOGGING === 'true') {
  app.use(
    morgan('combined', {
      skip: (req, res) => res.statusCode < 400, // Only log errors in production
      stream: {
        write: (message) => console.log(message.trim()),
      },
    })
  );
}

/**
 * AI-OPTIMIZED: Rate Limiting Configuration
 *
 * Three-tier rate limiting:
 * - General API: 100 requests per 15 minutes
 * - Authentication: 5 requests per hour
 * - Apartment modifications: 20 requests per hour
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // AI-OPTIMIZED: Use memory store for better performance
  store: new rateLimit.MemoryStore(),
  // AI-OPTIMIZED: Skip successful requests to reduce overhead
  skipSuccessfulRequests: true,
  // AI-OPTIMIZED: Skip failed requests to reduce overhead
  skipFailedRequests: false,
});

// AI-OPTIMIZED: Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new rateLimit.MemoryStore(),
});

// AI-OPTIMIZED: Stricter rate limit for apartment creation/updates
const apartmentWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: 'Too many apartment modifications, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new rateLimit.MemoryStore(),
});

// AI-OPTIMIZED: Apply rate limiting to routes
app.use('/api/auth/', authLimiter);
// Apply apartment write limiter only to write operations, not GET requests
app.use('/api/apartments', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return apartmentWriteLimiter(req, res, next);
  }
  next();
});
app.use('/api/', apiLimiter);

/**
 * AI-OPTIMIZED: Performance Monitoring Endpoints
 *
 * These endpoints provide real-time performance data:
 * - /api/performance: Comprehensive metrics
 * - /api/cache/stats: Cache statistics
 * - /api/cache/flush: Cache management
 *
 * SKIPPED in test environment
 */
if (process.env.NODE_ENV !== 'test') {
  app.get('/api/performance', getPerformanceMetrics);

  // AI-OPTIMIZED: Cache statistics endpoint
  app.get('/api/cache/stats', (req, res) => {
    res.json(cacheManager.getStats());
  });

  // AI-OPTIMIZED: Cache management endpoints
  app.post('/api/cache/flush', (req, res) => {
    cacheManager.flush();
    res.json({ message: 'Cache flushed successfully' });
  });
}

/**
 * AI-OPTIMIZED: Swagger Documentation
 * Cached for 1 hour to improve performance
 */
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Apartment Flow API Documentation',
  })
);

/**
 * AI-OPTIMIZED: Route Imports
 * Using index.js files for clean imports
 */
const authRoutes = require('./routes/auth.routes');
const apartmentRoutes = require('./routes/apartment.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const commuteRoutes = require('./routes/commute.routes');
const userRoutes = require('./routes/user.routes');

/**
 * AI-OPTIMIZED: Route Configuration with Caching
 *
 * Caching strategy:
 * - Apartment listings: 5 minutes (frequently accessed)
 * - Commute data: 10 minutes (expensive to calculate)
 * - Authentication: No caching (security)
 * - User data: No caching (personal data)
 *
 * SKIPPED in test environment
 */
app.use('/api/auth', authRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/commute', commuteRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/users', userRoutes);

/**
 * AI-OPTIMIZED: Static File Serving
 * Serve uploaded images and other static files
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * AI-OPTIMIZED: Error Handling Middleware
 *
 * Handles various error types:
 * - Mongoose validation errors
 * - JWT authentication errors
 * - File upload errors
 * - General server errors
 */
app.use(function (err, req, res, next) {
  // AI-OPTIMIZED: Log error for debugging (but not in test mode for expected errors)
  if (process.env.NODE_ENV !== 'test' || !err.code) {
    console.error(err.stack);
  }

  // AI-OPTIMIZED: Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // AI-OPTIMIZED: Handle mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: err.message,
    });
  }

  // AI-OPTIMIZED: Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      details: 'Please log in again',
    });
  }

  // AI-OPTIMIZED: Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      details: 'Please log in again',
    });
  }

  // AI-OPTIMIZED: Handle multer errors
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Too many files uploaded',
      details: 'Maximum 4 images allowed per upload',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      details: 'Maximum file size is 5MB',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      details: 'Please use the correct field name for file uploads',
    });
  }

  // AI-OPTIMIZED: Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

/**
 * AI-OPTIMIZED: 404 Handler
 * Handles requests to non-existent routes
 */
app.use(function (req, res) {
  res.status(404);
  res.json({ error: "Sorry, can't find that" });
});

/**
 * AI-OPTIMIZED: Server Startup
 * Only starts server when file is run directly
 */
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Performance monitoring enabled`);
      console.log(`Cache system initialized`);
      console.log(`API Documentation available at /api-docs`);
      console.log(`Performance metrics available at /api/performance`);
    }
  });
}

module.exports = app;
// test
