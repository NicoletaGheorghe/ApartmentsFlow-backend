const rateLimit = require('express-rate-limit');

// Helper: No-op middleware for test environment
const noop = (req, res, next) => next();

const isTestEnv = process.env.NODE_ENV === 'test';

// General API rate limiter
const generalLimiter = isTestEnv
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again after 15 minutes',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

// Stricter limiter for authentication routes
const authLimiter = isTestEnv
  ? noop
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // Limit each IP to 5 login attempts per hour
      message: 'Too many login attempts from this IP, please try again after an hour',
      standardHeaders: true,
      legacyHeaders: false,
    });

// Stricter limiter for apartment creation/updates
const apartmentModificationLimiter = isTestEnv
  ? noop
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Limit each IP to 10 apartment modifications per hour
      message: 'Too many apartment modifications from this IP, please try again after an hour',
      standardHeaders: true,
      legacyHeaders: false,
    });

module.exports = {
  generalLimiter,
  authLimiter,
  apartmentModificationLimiter,
};
