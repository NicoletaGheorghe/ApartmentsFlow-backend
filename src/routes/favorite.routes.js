const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const Apartment = require('../models/apartment.model');

// GET /api/favorites - Get user's favorite apartments
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching favorites' });
  }
});

// POST /api/favorites - Add apartment to favorites
router.post('/', protect, async (req, res) => {
  try {
    const { apartmentId } = req.body;

    // Check if apartment exists
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    // Add to favorites if not already there
    const user = await User.findById(req.user._id);
    if (!user.favorites.includes(apartmentId)) {
      user.favorites.push(apartmentId);
      await user.save();
    }

    res.json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Error adding to favorites' });
  }
});

// DELETE /api/favorites/:id - Remove apartment from favorites
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.favorites = user.favorites.filter((id) => id.toString() !== req.params.id);
    await user.save();
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Error removing from favorites' });
  }
});

module.exports = router;
