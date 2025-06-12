const Apartment = require('../models/apartment.model');

// @desc    Get all apartments
// @route   GET /api/apartments
// @access  Public
const getApartments = async (req, res, next) => {
  try {
    // Build query
    const query = {};

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Filter by bedrooms
    if (req.query.bedrooms) {
      query.bedrooms = Number(req.query.bedrooms);
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Search by location if coordinates provided
    if (req.query.lat && req.query.lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(req.query.lng), Number(req.query.lat)],
          },
          $maxDistance: req.query.radius ? Number(req.query.radius) * 1000 : 10000, // Default 10km
        },
      };
    }

    // Execute query with pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const apartments = await Apartment.find(query)
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Apartment.countDocuments(query);

    res.json({
      apartments,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single apartment
// @route   GET /api/apartments/:id
// @access  Public
const getApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id).populate('owner', 'name email');

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    res.json(apartment);
  } catch (error) {
    next(error);
  }
};

// @desc    Create apartment
// @route   POST /api/apartments
// @access  Private
const createApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.create({
      ...req.body,
      owner: req.user._id,
    });

    res.status(201).json(apartment);
  } catch (error) {
    next(error);
  }
};

// @desc    Update apartment
// @route   PUT /api/apartments/:id
// @access  Private
const updateApartment = async (req, res, next) => {
  try {
    let apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    // Check ownership
    if (apartment.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this apartment' });
    }

    apartment = await Apartment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(apartment);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete apartment
// @route   DELETE /api/apartments/:id
// @access  Private
const deleteApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    // Check ownership
    if (apartment.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this apartment' });
    }

    await apartment.deleteOne();

    res.json({ message: 'Apartment removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApartments,
  getApartment,
  createApartment,
  updateApartment,
  deleteApartment,
};
