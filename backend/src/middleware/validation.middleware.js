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

  body('neighborhoodRating')
    .optional()
    .isFloat({ min: 1, max: 10 })
    .withMessage('Neighborhood rating must be between 1 and 10'),

  body('commutingDistance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Commuting distance must be a positive number'),

  body('commuteMode')
    .optional()
    .isIn(['driving', 'walking', 'bicycling', 'transit'])
    .withMessage('Commute mode must be one of: driving, walking, bicycling, transit'),

  body('commuteDestination')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Commute destination must be between 3 and 200 characters'),

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

// Note validation
const validateNote = (req, res, next) => {
  const { title, content, apartmentId, category, priority, isPublic, tags } = req.body;

  const errors = [];

  // Required fields
  if (!title || title.trim().length === 0) {
    errors.push('Note title is required');
  } else if (title.length > 100) {
    errors.push('Note title cannot exceed 100 characters');
  }

  if (!content || content.trim().length === 0) {
    errors.push('Note content is required');
  } else if (content.length > 2000) {
    errors.push('Note content cannot exceed 2000 characters');
  }

  if (!apartmentId) {
    errors.push('Apartment ID is required');
  }

  // Category validation
  const validCategories = ['general', 'pros', 'cons', 'visit', 'research', 'comparison', 'other'];
  if (category && !validCategories.includes(category)) {
    errors.push('Invalid category');
  }

  // Priority validation
  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority)) {
    errors.push('Invalid priority level');
  }

  // Tags validation
  if (tags && Array.isArray(tags)) {
    if (tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }
    tags.forEach(tag => {
      if (tag.length > 20) {
        errors.push('Tag cannot exceed 20 characters');
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = {
  validateApartment,
  validateApartmentQuery,
  validateObjectId,
  validateNote,
};
