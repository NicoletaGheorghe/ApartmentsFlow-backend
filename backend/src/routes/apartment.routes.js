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

// Public routes
router.get('/', getApartments);
router.get('/:id', getApartment);

// Protected routes
router.use(protect);
router.post('/', createApartment);
router.put('/:id', updateApartment);
router.delete('/:id', deleteApartment);

module.exports = router;
