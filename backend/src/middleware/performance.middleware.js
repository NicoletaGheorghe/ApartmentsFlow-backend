const cacheManager = require('../config/cache');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  // Skip performance monitoring in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const start = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Add performance data to response headers
  res.on('finish', () => {
    // Check if headers have already been sent
    if (res.headersSent) {
      return;
    }

    const end = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    // Calculate response time in milliseconds
    const responseTime = Number(end - start) / 1000000;

    // Calculate memory usage difference
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
    };

    // Add performance headers only if not already sent
    try {
      res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
      res.setHeader('X-Memory-Usage', `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    } catch (error) {
      // Headers already sent, skip
    }

    // Log slow requests (over 1 second)
    if (responseTime > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} - ${responseTime.toFixed(2)}ms`);
    }

    // Log memory spikes (over 50MB increase)
    if (memoryDiff.heapUsed > 50 * 1024 * 1024) {
      console.warn(
        `MEMORY SPIKE: ${req.method} ${req.originalUrl} - +${(
          memoryDiff.heapUsed /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
    }

    // Store performance metrics in cache for monitoring
    const metrics = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      memoryUsage: endMemory,
      memoryDiff,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    // Store last 100 performance metrics
    const performanceKey = 'performance:metrics';
    let metricsList = cacheManager.get(performanceKey) || [];
    metricsList.push(metrics);

    // Keep only last 100 entries
    if (metricsList.length > 100) {
      metricsList = metricsList.slice(-100);
    }

    cacheManager.set(performanceKey, metricsList, 3600); // Keep for 1 hour
  });

  next();
};

// Database query performance monitoring
const queryPerformanceMonitor = (req, res, next) => {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const mongoose = require('mongoose');

  // Track query execution time
  const originalExec = mongoose.Query.prototype.exec;

  mongoose.Query.prototype.exec = function () {
    const start = process.hrtime.bigint();
    const query = this;

    return originalExec.apply(this, arguments).then((result) => {
      const end = process.hrtime.bigint();
      const queryTime = Number(end - start) / 1000000;

      // Log slow queries (over 100ms)
      if (queryTime > 100) {
        console.warn(
          `SLOW QUERY: ${queryTime.toFixed(2)}ms - ${query.model.modelName}.${query.op}`
        );
      }

      return result;
    });
  };

  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const memoryUsage = process.memoryUsage();
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
  const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

  // AI-OPTIMIZED: Log high memory usage only if it exceeds a reasonable threshold
  // This avoids noisy logs when the absolute memory usage is low.
  const highUsageThreshold = 95; // 95%
  const absoluteMemoryThresholdMB = 100; // 100 MB

  if (heapUsagePercent > highUsageThreshold && heapUsedMB > absoluteMemoryThresholdMB) {
    console.warn(
      `HIGH MEMORY ALERT: ${heapUsagePercent.toFixed(2)}% (${heapUsedMB.toFixed(
        2
      )}MB / ${heapTotalMB.toFixed(2)}MB)`
    );
  }

  // Add memory usage to response headers only if not already sent
  try {
    res.setHeader('X-Heap-Usage', `${heapUsagePercent.toFixed(2)}%`);
    res.setHeader('X-Heap-Used', `${heapUsedMB.toFixed(2)}MB`);
  } catch (error) {
    // Headers already sent, skip
  }

  next();
};

// Cache performance monitoring
const cachePerformanceMonitor = (req, res, next) => {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const cacheStats = cacheManager.getStats();

  // Add cache performance headers only if not already sent
  try {
    res.setHeader('X-Cache-Hit-Rate', `${(cacheStats.hitRate * 100).toFixed(2)}%`);
    res.setHeader('X-Cache-Keys', cacheStats.keys);
  } catch (error) {
    // Headers already sent, skip
  }

  // Log low cache hit rate (under 50%)
  if (cacheStats.hitRate < 0.5 && cacheStats.hits + cacheStats.misses > 10) {
    console.warn(`LOW CACHE HIT RATE: ${(cacheStats.hitRate * 100).toFixed(2)}%`);
  }

  next();
};

// Performance metrics endpoint
const getPerformanceMetrics = (req, res) => {
  const cacheStats = cacheManager.getStats();
  const memoryUsage = process.memoryUsage();
  const performanceMetrics = cacheManager.get('performance:metrics') || [];

  // Calculate average response time
  const avgResponseTime =
    performanceMetrics.length > 0
      ? performanceMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) /
        performanceMetrics.length
      : 0;

  // Get slowest requests
  const slowestRequests = performanceMetrics
    .sort((a, b) => b.responseTime - a.responseTime)
    .slice(0, 5);

  const metrics = {
    timestamp: new Date().toISOString(),
    cache: {
      hitRate: cacheStats.hitRate,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      keys: cacheStats.keys,
      memoryUsage: cacheStats.memoryUsage,
    },
    memory: {
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      heapUsage: `${((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)}%`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
    },
    performance: {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      totalRequests: performanceMetrics.length,
      slowestRequests,
    },
    uptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
  };

  res.json(metrics);
};

module.exports = {
  performanceMonitor,
  queryPerformanceMonitor,
  memoryMonitor,
  cachePerformanceMonitor,
  getPerformanceMetrics,
};
