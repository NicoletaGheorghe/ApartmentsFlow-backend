const express = require('express');
const router = express.Router();
const {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  getApartmentNotes,
  getNoteStats,
} = require('../controllers/note.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateNote } = require('../middleware/validation.middleware');

// All routes are protected
router.use(protect);

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', validateNote, createNote);

// @route   GET /api/notes
// @desc    Get all notes for current user
// @access  Private
router.get('/', getNotes);

// @route   GET /api/notes/stats
// @desc    Get note statistics for user
// @access  Private
router.get('/stats', getNoteStats);

// @route   GET /api/notes/apartment/:apartmentId
// @desc    Get notes for a specific apartment
// @access  Private
router.get('/apartment/:apartmentId', getApartmentNotes);

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Private
router.get('/:id', getNote);

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private
router.put('/:id', validateNote, updateNote);

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
router.delete('/:id', deleteNote);

module.exports = router;
