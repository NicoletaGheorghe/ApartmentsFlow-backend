const { body, param, query } = require('express-validator');

// Validation middleware for apartment creation/updates
const validateApartment = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Location must be between 3 and 500 characters'),

  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),

  body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a non-negative number'),

  body('area').isFloat({ min: 0 }).withMessage('Area must be a positive number'),

  body('amenities').optional().isArray().withMessage('Amenities must be an array'),

  body('images').optional().isArray().withMessage('Images must be an array'),

  body('status')
    .optional()
    .isIn(['available', 'rented', 'pending'])
    .withMessage('Invalid status value'),

  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),

  body('externalUrl').optional().isURL().withMessage('Invalid external URL format'),
];

// Validation middleware for query parameters
const validateApartmentQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),

  query('bedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a non-negative integer'),

  query('status')
    .optional()
    .isIn(['available', 'rented', 'pending'])
    .withMessage('Invalid status value'),

  query('lat').optional().isFloat().withMessage('Latitude must be a valid number'),

  query('lng').optional().isFloat().withMessage('Longitude must be a valid number'),

  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be a positive number'),
];

// Validation middleware for MongoDB ObjectId parameters
const validateObjectId = [param('id').isMongoId().withMessage('Invalid ID format')];

module.exports = {
  validateApartment,
  validateApartmentQuery,
  validateObjectId,
};
