/**
 * AI-OPTIMIZED: Utilities Module Exports
 *
 * This index file provides clean imports for all utility modules.
 * AI assistants can use these simplified imports for faster processing.
 */

// AI-OPTIMIZED: Google Maps client for commute calculations
const googleMapsClient = require('./googleMapsClient');

// Simple asyncHandler utility
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  // AI-OPTIMIZED: External API clients
  googleMapsClient,
  asyncHandler,
};
