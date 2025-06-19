#!/usr/bin/env node

/**
 * Cache Statistics Script
 * Provides detailed cache performance statistics
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const LOG_FILE = path.join(__dirname, '../logs/cache-stats.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Cache statistics class
class CacheStats {
  constructor() {
    this.stats = [];
    this.startTime = Date.now();
  }

  // Collect cache statistics
  async collectStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cache/stats`);
      
      const stats = {
        timestamp: new Date().toISOString(),
        ...response.data,
        uptime: process.uptime()
      };

      this.stats.push(stats);
      this.logStats(stats);
      
      return stats;
    } catch (error) {
      console.error('Error collecting cache stats:', error.message);
      return null;
    }
  }

  // Log stats to file
  logStats(stats) {
    const logEntry = JSON.stringify(stats) + '\n';
    fs.appendFileSync(LOG_FILE, logEntry);
  }

  // Generate cache report
  generateReport() {
    if (this.stats.length === 0) {
      console.log('No cache statistics collected yet');
      return;
    }

    const latest = this.stats[this.stats.length - 1];
    const avgHitRate = this.stats.reduce((sum, s) => sum + s.hitRate, 0) / this.stats.length;
    const avgKeys = this.stats.reduce((sum, s) => sum + s.keys, 0) / this.stats.length;

    console.log('\n=== CACHE STATISTICS REPORT ===');
    console.log(`Monitoring Duration: ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes`);
    console.log(`Total Snapshots: ${this.stats.length}`);
    console.log(`Current Hit Rate: ${(latest.hitRate * 100).toFixed(2)}%`);
    console.log(`Average Hit Rate: ${(avgHitRate * 100).toFixed(2)}%`);
    console.log(`Current Cache Keys: ${latest.keys}`);
    console.log(`Average Cache Keys: ${avgKeys.toFixed(0)}`);
    console.log(`Memory Usage: ${(latest.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Cache Size: ${latest.cacheSize}`);
    console.log('==============================\n');
  }

  // Start continuous monitoring
  startMonitoring(intervalMs = 30000) { // Default: 30 seconds
    console.log(`Starting cache statistics monitoring...`);
    console.log(`Stats will be collected every ${intervalMs / 1000} seconds`);
    console.log(`Log file: ${LOG_FILE}`);

    // Collect initial stats
    this.collectStats();

    // Set up interval for continuous monitoring
    this.interval = setInterval(async () => {
      await this.collectStats();
      this.generateReport();
    }, intervalMs);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nStopping cache statistics monitoring...');
      clearInterval(this.interval);
      this.generateReport();
      process.exit(0);
    });
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('Cache statistics monitoring stopped');
    }
  }

  // Flush cache
  async flushCache() {
    try {
      await axios.post(`${API_BASE_URL}/api/cache/flush`);
      console.log('Cache flushed successfully');
    } catch (error) {
      console.error('Error flushing cache:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  const cacheStats = new CacheStats();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      const interval = parseInt(args[1]) || 30000;
      cacheStats.startMonitoring(interval);
      break;
    
    case 'report':
      cacheStats.generateReport();
      break;
    
    case 'collect':
      cacheStats.collectStats().then(() => {
        cacheStats.generateReport();
        process.exit(0);
      });
      break;

    case 'flush':
      cacheStats.flushCache().then(() => {
        process.exit(0);
      });
      break;
    
    default:
      console.log('Usage:');
      console.log('  node cache-stats.js start [interval_ms]  - Start continuous monitoring');
      console.log('  node cache-stats.js report               - Generate report from logs');
      console.log('  node cache-stats.js collect              - Collect single stats snapshot');
      console.log('  node cache-stats.js flush                - Flush all cache data');
      break;
  }
}

module.exports = CacheStats; 