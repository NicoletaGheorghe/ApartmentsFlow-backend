#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors system performance and logs metrics
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const LOG_FILE = path.join(__dirname, '../logs/performance.log');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.startTime = Date.now();
  }

  // Collect performance metrics
  async collectMetrics() {
    try {
      const [performanceRes, cacheRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/performance`),
        axios.get(`${API_BASE_URL}/api/cache/stats`),
      ]);

      const metrics = {
        timestamp: new Date().toISOString(),
        performance: performanceRes.data,
        cache: cacheRes.data,
        uptime: process.uptime(),
      };

      this.metrics.push(metrics);
      this.logMetrics(metrics);

      return metrics;
    } catch (error) {
      console.error('Error collecting metrics:', error.message);
      return null;
    }
  }

  // Log metrics to file
  logMetrics(metrics) {
    const logEntry = JSON.stringify(metrics) + '\n';
    fs.appendFileSync(LOG_FILE, logEntry);
  }

  // Generate performance report
  generateReport() {
    if (this.metrics.length === 0) {
      console.log('No metrics collected yet');
      return;
    }

    const latest = this.metrics[this.metrics.length - 1];
    const avgResponseTime =
      this.metrics.reduce(
        (sum, m) => sum + parseFloat(m.performance.performance.avgResponseTime),
        0
      ) / this.metrics.length;

    console.log('\n=== PERFORMANCE REPORT ===');
    console.log(
      `Monitoring Duration: ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes`
    );
    console.log(`Total Metrics Collected: ${this.metrics.length}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${(latest.cache.hitRate * 100).toFixed(2)}%`);
    console.log(`Memory Usage: ${latest.performance.memory.heapUsage}`);
    console.log(`Active Cache Keys: ${latest.cache.keys}`);
    console.log('========================\n');
  }

  // Start continuous monitoring
  startMonitoring(intervalMs = 60000) {
    // Default: 1 minute
    console.log(`Starting performance monitoring...`);
    console.log(`Metrics will be collected every ${intervalMs / 1000} seconds`);
    console.log(`Log file: ${LOG_FILE}`);

    // Collect initial metrics
    this.collectMetrics();

    // Set up interval for continuous monitoring
    this.interval = setInterval(async () => {
      await this.collectMetrics();
      this.generateReport();
    }, intervalMs);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nStopping performance monitoring...');
      clearInterval(this.interval);
      this.generateReport();
      process.exit(0);
    });
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('Performance monitoring stopped');
    }
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new PerformanceMonitor();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      const interval = parseInt(args[1]) || 60000;
      monitor.startMonitoring(interval);
      break;

    case 'report':
      monitor.generateReport();
      break;

    case 'collect':
      monitor.collectMetrics().then(() => {
        monitor.generateReport();
        process.exit(0);
      });
      break;

    default:
      console.log('Usage:');
      console.log(
        '  node performance-monitor.js start [interval_ms]  - Start continuous monitoring'
      );
      console.log('  node performance-monitor.js report               - Generate report from logs');
      console.log(
        '  node performance-monitor.js collect              - Collect single metrics snapshot'
      );
      break;
  }
}

module.exports = PerformanceMonitor;
