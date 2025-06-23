const User = require('../models/user.model');
const Apartment = require('../models/apartment.model');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, bio, profileImage, password } = req.body;

    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (bio) updateFields.bio = bio;
    if (profileImage) updateFields.profileImage = profileImage;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user profile
// @route   DELETE /api/users/profile
// @access  Private
const deleteProfile = async (req, res, next) => {
  try {
    // Delete user's apartments if they are the owner
    await Apartment.deleteMany({ owner: req.user._id });

    // Delete the user
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'User profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved searches
// @route   GET /api/users/searches
// @access  Private
const getSavedSearches = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('savedSearches');
    res.json(user.savedSearches);
  } catch (error) {
    next(error);
  }
};

// @desc    Save search
// @route   POST /api/users/searches
// @access  Private
const saveSearch = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { savedSearches: req.body } },
      { new: true, runValidators: true }
    ).select('savedSearches');

    res.json(user.savedSearches);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete saved search
// @route   DELETE /api/users/searches/:id
// @access  Private
const deleteSavedSearch = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedSearches: { _id: req.params.id } } },
      { new: true }
    ).select('savedSearches');

    res.json(user.savedSearches);
  } catch (error) {
    next(error);
  }
};

// @desc    Get favorite apartments
// @route   GET /api/users/favorites
// @access  Private
const getFavoriteApartments = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'apartmentNotes.apartment',
      select: 'title price location bedrooms bathrooms area amenities images',
    });

    res.json(user.apartmentNotes);
  } catch (error) {
    next(error);
  }
};

// @desc    Get apartment notes
// @route   GET /api/users/apartments/:id/notes
// @access  Private
const getApartmentNotes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const apartmentNotes = user.apartmentNotes.find(
      (note) => note.apartment.toString() === req.params.id
    );

    if (!apartmentNotes) {
      return res.json({ notes: [] });
    }

    res.json(apartmentNotes.notes);
  } catch (error) {
    next(error);
  }
};

// @desc    Add apartment note
// @route   POST /api/users/apartments/:id/notes
// @access  Private
const addApartmentNote = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id);
    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    const user = await User.findById(req.user._id);
    const apartmentNotes = user.apartmentNotes.find(
      (note) => note.apartment.toString() === req.params.id
    );

    if (apartmentNotes) {
      apartmentNotes.notes.push({ content: req.body.content });
    } else {
      user.apartmentNotes.push({
        apartment: req.params.id,
        notes: [{ content: req.body.content }],
      });
    }

    await user.save();
    res.json(user.apartmentNotes);
  } catch (error) {
    next(error);
  }
};

// @desc    Update apartment note
// @route   PUT /api/users/apartments/:id/notes/:noteId
// @access  Private
const updateApartmentNote = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const apartmentNotes = user.apartmentNotes.find(
      (note) => note.apartment.toString() === req.params.id
    );

    if (!apartmentNotes) {
      return res.status(404).json({ error: 'Apartment notes not found' });
    }

    const note = apartmentNotes.notes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.content = req.body.content;
    note.updatedAt = Date.now();

    await user.save();
    res.json(apartmentNotes.notes);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete apartment note
// @route   DELETE /api/users/apartments/:id/notes/:noteId
// @access  Private
const deleteApartmentNote = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const apartmentNotes = user.apartmentNotes.find(
      (note) => note.apartment.toString() === req.params.id
    );

    if (!apartmentNotes) {
      return res.status(404).json({ error: 'Apartment notes not found' });
    }

    apartmentNotes.notes = apartmentNotes.notes.filter(
      (note) => note._id.toString() !== req.params.noteId
    );

    await user.save();
    res.json(apartmentNotes.notes);
  } catch (error) {
    next(error);
  }
};

// IMPORTANT: Handles user profile, update, and deletion logic
// TODO: Add user role management endpoints if needed in the future

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  updatePreferences,
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
  getFavoriteApartments,
  getApartmentNotes,
  addApartmentNote,
  updateApartmentNote,
  deleteApartmentNote,
};
