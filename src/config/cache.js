const NodeCache = require('node-cache');

// Enhanced caching configuration
class CacheManager {
  constructor() {
    // Initialize NodeCache with optimized settings
    this.cache = new NodeCache({
      stdTTL: 600, // 10 minutes default TTL
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Disable cloning for better performance
      deleteOnExpire: true, // Automatically delete expired keys
      maxKeys: 1000, // Maximum number of keys in cache
      // Memory optimization
      objectValueSize: 1000, // Maximum size of cached objects
      arrayValueSize: 1000, // Maximum size of cached arrays
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0,
    };

    // Setup cache event listeners
    this.setupEventListeners();
  }

  // Setup cache event listeners for monitoring
  setupEventListeners() {
    this.cache.on('set', (key, value) => {
      this.stats.keys = this.cache.keys().length;
      this.stats.ksize += key.length;
      this.stats.vsize += JSON.stringify(value).length;
    });

    this.cache.on('del', (key, value) => {
      this.stats.keys = this.cache.keys().length;
      this.stats.ksize -= key.length;
      this.stats.vsize -= JSON.stringify(value).length;
    });

    this.cache.on('expired', (key, value) => {
      this.stats.keys = this.cache.keys().length;
      this.stats.ksize -= key.length;
      this.stats.vsize -= JSON.stringify(value).length;
    });
  }

  // Get value from cache with hit/miss tracking
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      return value;
    } else {
      this.stats.misses++;
      return null;
    }
  }

  // Set value in cache with optimized TTL
  set(key, value, ttl = 600) {
    return this.cache.set(key, value, ttl);
  }

  // Delete value from cache
  del(key) {
    return this.cache.del(key);
  }

  // Clear all cache
  flush() {
    this.cache.flushAll();
    this.resetStats();
  }

  // Get cache statistics
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memoryUsage: process.memoryUsage(),
      cacheSize: this.cache.getStats(),
    };
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      ksize: 0,
      vsize: 0,
    };
  }

  // Cache apartment listings with optimized TTL
  cacheApartments(key, data, filters = {}) {
    // Shorter TTL for filtered results
    const ttl = Object.keys(filters).length > 0 ? 300 : 600;
    return this.set(`apartments:${key}`, data, ttl);
  }

  // Cache user data with longer TTL
  cacheUser(key, data) {
    return this.set(`user:${key}`, data, 1800); // 30 minutes
  }

  // Cache authentication tokens
  cacheToken(key, data) {
    return this.set(`token:${key}`, data, 3600); // 1 hour
  }

  // Invalidate apartment-related cache
  invalidateApartments() {
    const keys = this.cache.keys();
    const apartmentKeys = keys.filter((key) => key.startsWith('apartments:'));
    apartmentKeys.forEach((key) => this.del(key));
  }

  // Invalidate user-related cache
  invalidateUser(userId) {
    const keys = this.cache.keys();
    const userKeys = keys.filter((key) => key.includes(`user:${userId}`));
    userKeys.forEach((key) => this.del(key));
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
