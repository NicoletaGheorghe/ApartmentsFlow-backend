const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  updatePreferences,
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
  getFavoriteApartments,
  getApartmentNotes,
  addApartmentNote,
  updateApartmentNote,
  deleteApartmentNote
} = require('../controllers/user.controller');

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Preferences routes
router.get('/preferences', protect, updatePreferences);
router.put('/preferences', protect, updatePreferences);

// Saved searches routes
router.get('/searches', protect, getSavedSearches);
router.post('/searches', protect, saveSearch);
router.delete('/searches/:id', protect, deleteSavedSearch);

// Favorites and notes routes
router.get('/favorites', protect, getFavoriteApartments);
router.get('/apartments/:id/notes', protect, getApartmentNotes);
router.post('/apartments/:id/notes', protect, addApartmentNote);
router.put('/apartments/:id/notes/:noteId', protect, updateApartmentNote);
router.delete('/apartments/:id/notes/:noteId', protect, deleteApartmentNote);

module.exports = router; 