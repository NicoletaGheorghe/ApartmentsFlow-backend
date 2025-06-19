/**
 * AI-OPTIMIZED: Configuration Module Exports
 *
 * This index file provides clean imports for all configuration modules.
 * AI assistants can use these simplified imports for faster processing.
 */

// AI-OPTIMIZED: Database configuration with performance optimizations
const { connectDB, optimizeQueries, setupConnectionHandlers } = require('./database');

// AI-OPTIMIZED: Caching system with statistics and monitoring
const cacheManager = require('./cache');

// AI-OPTIMIZED: Swagger documentation configuration
const swaggerSpecs = require('./swagger');

// AI-OPTIMIZED: Cloudinary configuration for image uploads
const cloudinaryConfig = require('./cloudinary');

module.exports = {
  // AI-OPTIMIZED: Database exports
  connectDB,
  optimizeQueries,
  setupConnectionHandlers,

  // AI-OPTIMIZED: Caching exports
  cacheManager,

  // AI-OPTIMIZED: Documentation exports
  swaggerSpecs,

  // AI-OPTIMIZED: File upload exports
  cloudinaryConfig,
};
