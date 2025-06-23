const express = require('express');
const router = express.Router();
const commuteController = require('../controllers/commute.controller');

// GET /api/commute/suggestions
router.get('/suggestions', commuteController.getAddressSuggestions);

// GET /api/commute/:apartmentId
router.get('/:apartmentId', function (req, res, next) {
  // TODO: Get commute times for apartment
  res.status(501).json({ error: 'Not implemented yet' });
});

// POST /api/commute
router.post('/', commuteController.getCommuteTime);

// POST /api/commute/multiple
router.post('/multiple', commuteController.getMultipleCommuteTimes);

// GET /api/commute/place/:placeId
router.get('/place/:placeId', commuteController.getPlaceDetails);

module.exports = router;
