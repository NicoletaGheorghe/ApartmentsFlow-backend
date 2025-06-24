const Note = require('../models/note.model');
const Apartment = require('../models/apartment.model');
const { asyncHandler } = require('../utils');

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = asyncHandler(async (req, res) => {
  const { apartmentId, title, content, category, priority, isPublic, tags } = req.body;

  // Validate apartment exists
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    return res.status(404).json({
      success: false,
      message: 'Apartment not found',
    });
  }

  // Check if user has access to this apartment (public or their own)
  if (
    !apartment.isPublic &&
    apartment.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this apartment',
    });
  }

  const note = await Note.create({
    user: req.user.id,
    apartment: apartmentId,
    title,
    content,
    category,
    priority,
    isPublic,
    tags: tags || [],
  });

  // Populate apartment details for response
  await note.populate('apartment', 'title address price bedrooms bathrooms');

  res.status(201).json({
    success: true,
    data: note,
  });
});

// @desc    Get all notes for current user
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
  const {
    apartmentId,
    category,
    priority,
    search,
    sort = '-createdAt',
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query = { user: req.user.id };

  if (apartmentId) {
    query.apartment = apartmentId;
  }

  if (category) {
    query.category = category;
  }

  if (priority) {
    query.priority = priority;
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Execute query
  const notes = await Note.find(query)
    .populate('apartment', 'title address price bedrooms bathrooms images')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await Note.countDocuments(query);

  res.json({
    success: true,
    data: notes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Private
const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id)
    .populate('apartment', 'title address price bedrooms bathrooms images')
    .populate('user', 'name email');

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found',
    });
  }

  // Check access (user owns note or note is public)
  if (note.user._id.toString() !== req.user.id && !note.isPublic && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this note',
    });
  }

  res.json({
    success: true,
    data: note,
  });
});

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = asyncHandler(async (req, res) => {
  let note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found',
    });
  }

  // Check ownership BEFORE any validation
  if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this note',
    });
  }

  // Now validate and update
  note = await Note.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('apartment', 'title address price bedrooms bathrooms images');

  res.json({
    success: true,
    data: note,
  });
});

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found',
    });
  }

  // Check ownership
  if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this note',
    });
  }

  await note.deleteOne();

  res.json({
    success: true,
    message: 'Note deleted successfully',
  });
});

// @desc    Get notes for a specific apartment (public notes + user's own)
// @route   GET /api/notes/apartment/:apartmentId
// @access  Private
const getApartmentNotes = asyncHandler(async (req, res) => {
  const { apartmentId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate apartment exists
  const apartment = await Apartment.findById(apartmentId);
  if (!apartment) {
    return res.status(404).json({
      success: false,
      message: 'Apartment not found',
    });
  }

  // Build query: user's own notes OR public notes
  const query = {
    apartment: apartmentId,
    $or: [{ user: req.user.id }, { isPublic: true }],
  };

  const skip = (page - 1) * limit;

  const notes = await Note.find(query)
    .populate('user', 'name')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Note.countDocuments(query);

  res.json({
    success: true,
    data: notes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get note statistics for user
// @route   GET /api/notes/stats
// @access  Private
const getNoteStats = asyncHandler(async (req, res) => {
  const stats = await Note.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        byCategory: {
          $push: {
            category: '$category',
            count: 1,
          },
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1,
          },
        },
      },
    },
  ]);

  // Process category stats
  const categoryStats = {};
  if (stats.length > 0 && stats[0].byCategory) {
    stats[0].byCategory.forEach((item) => {
      categoryStats[item.category] = (categoryStats[item.category] || 0) + item.count;
    });
  }

  // Process priority stats
  const priorityStats = {};
  if (stats.length > 0 && stats[0].byPriority) {
    stats[0].byPriority.forEach((item) => {
      priorityStats[item.priority] = (priorityStats[item.priority] || 0) + item.count;
    });
  }

  res.json({
    success: true,
    data: {
      totalNotes: stats.length > 0 ? stats[0].totalNotes : 0,
      byCategory: categoryStats,
      byPriority: priorityStats,
    },
  });
});

module.exports = {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  getApartmentNotes,
  getNoteStats,
};
