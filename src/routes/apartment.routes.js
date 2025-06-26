const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { validateApartmentQuery } = require('../middleware/validation.middleware');
const {
  getApartments,
  getApartment,
  createApartment,
  updateApartment,
  deleteApartment,
  autofillListingFromUrl,
  uploadImages,
  calculateCommuteDistance,
} = require('../controllers/apartment.controller');
const upload = require('../middleware/upload');
const contentModeration = require('../middleware/contentModeration').contentModeration;

// Validation middleware for creation
const validateApartmentInput = (req, res, next) => {
  // Convert amenities from comma-separated string to array if needed
  if (req.body.amenities && typeof req.body.amenities === 'string') {
    req.body.amenities = req.body.amenities.split(',').map(item => item.trim()).filter(item => item.length > 0);
  }
  const { title, description, price, location, bedrooms, bathrooms, area, amenities, status } = req.body;
  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  if (!price || isNaN(price) || price <= 0) {
    errors.push('Price must be a positive number');
  }

  // Validate location object
  if (!location) {
    errors.push('Location is required');
  } else if (typeof location === 'object') {
    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      errors.push('Location coordinates are required and must be an array of [longitude, latitude]');
    }
    if (!location.address) {
      errors.push('Location address is required');
    } else {
      if (!location.address.street || !location.address.city || !location.address.state || !location.address.zipCode || !location.address.country) {
        errors.push('Location address must include street, city, state, zipCode, and country');
      }
    }
  } else if (typeof location === 'string' && location.trim().length < 3) {
    errors.push('Location must be at least 3 characters long');
  }

  if (bedrooms === undefined || bedrooms === null || isNaN(bedrooms) || bedrooms < 0) {
    errors.push('Bedrooms must be a non-negative number');
  }

  if (bathrooms === undefined || bathrooms === null || isNaN(bathrooms) || bathrooms < 0) {
    errors.push('Bathrooms must be a non-negative number');
  }

  if (!area || isNaN(area) || area <= 0) {
    errors.push('Area must be a positive number');
  }

  if (!amenities || !Array.isArray(amenities) || amenities.length === 0) {
    errors.push('Amenities must be a non-empty array');
  }

  if (!status || !['available', 'rented', 'pending'].includes(status)) {
    errors.push('Status must be one of: available, rented, pending');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validation middleware for updates (allows partial updates)
const validateApartmentUpdate = (req, res, next) => {
  const { title, description, price, location } = req.body;
  const errors = [];

  if (title !== undefined && (!title || title.trim().length < 3)) {
    errors.push('Title must be at least 3 characters long');
  }

  if (description !== undefined && (!description || description.trim().length < 10)) {
    errors.push('Description must be at least 10 characters long');
  }

  if (price !== undefined && (!price || isNaN(price) || price <= 0)) {
    errors.push('Price must be a positive number');
  }

  if (location !== undefined && (!location || (typeof location === 'string' && location.trim().length < 3))) {
    errors.push('Location must be at least 3 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Public routes - accessible without authentication
router.get('/public', validateApartmentQuery, getApartments); // Public listings only

// Protected routes - require authentication
router.get('/', protect, validateApartmentQuery, getApartments); // All listings based on role
router.get('/:id', protect, getApartment);
router.post('/', protect, upload.array('images', 8), validateApartmentInput, createApartment);
router.post('/json', protect, validateApartmentInput, createApartment); // JSON data without file uploads
router.put('/:id', protect, upload.array('images', 8), validateApartmentUpdate, updateApartment);

router.delete('/:id', protect, deleteApartment);

// Autofill listing from URL
router.post('/autofill', protect, autofillListingFromUrl);
router.post(
  '/upload-images',
  protect,
  authorize('admin', 'agent'),
  upload.array('images', 8),
  contentModeration,
  uploadImages
);

// Calculate and save commute distance
router.post('/:id/commute', protect, calculateCommuteDistance);

/**
 * @swagger
 * components:
 *   schemas:
 *     Apartment:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - location
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the apartment listing
 *         description:
 *           type: string
 *           description: Detailed description of the apartment
 *         price:
 *           type: number
 *           description: Monthly rent price
 *         location:
 *           type: string
 *           description: Full address of the apartment
 *         bedrooms:
 *           type: number
 *           description: Number of bedrooms
 *         bathrooms:
 *           type: number
 *           description: Number of bathrooms
 *         squareFeet:
 *           type: number
 *           description: Size of the apartment in square feet
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           description: List of available amenities
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs of apartment images
 *         availableFrom:
 *           type: string
 *           format: date
 *           description: Date when the apartment becomes available
 *         neighborhoodRating:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           description: Neighborhood rating from 1-10
 *         commutingDistance:
 *           type: number
 *           minimum: 0
 *           description: Commuting distance in minutes
 *         commuteMode:
 *           type: string
 *           enum: [driving, walking, bicycling, transit]
 *           description: Mode of transportation for commute
 *         commuteDestination:
 *           type: string
 *           description: Destination for commute calculation
 */

/**
 * @swagger
 * /api/apartments:
 *   get:
 *     summary: Get all apartments with optional filters
 *     tags: [Apartments]
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: number
 *         description: Number of bedrooms filter
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of apartments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Apartment'
 */

module.exports = router;
