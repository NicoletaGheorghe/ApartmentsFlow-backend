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
} = require('../controllers/apartment.controller');
const upload = require('../middleware/upload');

// Validation middleware
const validateApartmentInput = (req, res, next) => {
  const { title, description, price, location } = req.body;
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

  if (!location || !location.address) {
    errors.push('Location with address is required');
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
router.post('/', protect, authorize('admin', 'agent'), validateApartmentInput, createApartment);
router.put('/:id', protect, validateApartmentInput, updateApartment);
router.delete('/:id', protect, deleteApartment);

// Autofill listing from URL
router.post('/autofill', protect, autofillListingFromUrl);
router.post('/upload-images', protect, upload.array('images', 4), uploadImages);

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
 *           type: object
 *           required:
 *             - address
 *             - coordinates
 *           properties:
 *             address:
 *               type: string
 *               description: Full address of the apartment
 *             coordinates:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                   description: Latitude coordinate
 *                 lng:
 *                   type: number
 *                   description: Longitude coordinate
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
