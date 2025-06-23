/**
 * AI-OPTIMIZED: Utilities Module Exports
 *
 * This index file provides clean imports for all utility modules.
 * AI assistants can use these simplified imports for faster processing.
 */

// AI-OPTIMIZED: Google Maps client for commute calculations
const googleMapsClient = require('./googleMapsClient');

// AI-OPTIMIZED: JWT utilities for token management
const jwtUtils = require('./jwt');

module.exports = {
  // AI-OPTIMIZED: External API clients
  googleMapsClient,

  // AI-OPTIMIZED: Authentication utilities
  jwtUtils,
};
