const express = require('express');
const router = express.Router();

// GET /api/commute/:apartmentId
router.get('/:apartmentId', function (req, res, next) {
  // TODO: Get commute times for apartment
  res.status(501).json({ error: 'Not implemented yet' });
});

// POST /api/commute/calculate
router.post('/calculate', function (req, res, next) {
  // TODO: Calculate commute time between two points
  res.status(501).json({ error: 'Not implemented yet' });
});

module.exports = router;
