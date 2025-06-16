const express = require('express');
const router = express.Router();
const {
  getApartments,
  getApartment,
  createApartment,
  updateApartment,
  deleteApartment,
} = require('../controllers/apartment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

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
router.get('/', getApartments);

/**
 * @swagger
 * /api/apartments/{id}:
 *   get:
 *     summary: Get a single apartment by ID
 *     tags: [Apartments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Apartment ID
 *     responses:
 *       200:
 *         description: Apartment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Apartment'
 *       404:
 *         description: Apartment not found
 */
router.get('/:id', getApartment);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /api/apartments:
 *   post:
 *     summary: Create a new apartment listing
 *     tags: [Apartments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Apartment'
 *     responses:
 *       201:
 *         description: Apartment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Apartment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 */
router.post('/', createApartment);

/**
 * @swagger
 * /api/apartments/{id}:
 *   put:
 *     summary: Update an apartment listing
 *     tags: [Apartments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Apartment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Apartment'
 *     responses:
 *       200:
 *         description: Apartment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Apartment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Apartment not found
 */
router.put('/:id', updateApartment);

/**
 * @swagger
 * /api/apartments/{id}:
 *   delete:
 *     summary: Delete an apartment listing
 *     tags: [Apartments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Apartment ID
 *     responses:
 *       200:
 *         description: Apartment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Apartment not found
 */
router.delete('/:id', deleteApartment);

module.exports = router;
