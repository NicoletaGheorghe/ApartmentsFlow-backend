const Apartment = require('../models/apartment.model');
const NodeCache = require('node-cache');
const axios = require('axios');
const cheerio = require('cheerio');
const cloudinary = require('cloudinary');

// Initialize cache with a standard TTL of 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

// Query builder for apartment filters
const buildApartmentQuery = (req) => {
  // Handle user role-based access
  if (req.user) {
    if (req.user.role === 'admin') {
      // Admin sees all listings
      return {};
    } else if (req.user.role === 'agent') {
      // Agent sees public listings and their own private listings
      return {
        $or: [{ isPublic: true }, { owner: req.user._id }],
      };
    } else {
      // Regular users see only public listings
      return { isPublic: true };
    }
  } else {
    // Unauthenticated users see only public listings
    return { isPublic: true };
  }
};

// @desc    Get all apartments
// @route   GET /api/apartments
// @access  Public
const getApartments = async (req, res) => {
  try {
    const query = buildApartmentQuery(req);

    // Execute query with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const apartments = await Apartment.find(query)
      .select(
        'title price location bedrooms bathrooms area amenities images owner status isPublic createdAt'
      )
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Apartment.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return res.json({
      apartments,
      page,
      pages,
      total,
    });
  } catch (error) {
    console.error('Error in getApartments:', error);
    return res.status(500).json({ message: 'Error fetching apartments', error: error.message });
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

    // Check if the apartment is public or if the user has access
    if (
      !apartment.isPublic &&
      (!req.user ||
        (apartment.owner._id.toString() !== req.user._id.toString() &&
          req.user.role !== 'admin' &&
          req.user.role !== 'agent'))
    ) {
      return res.status(403).json({ error: 'Not authorized to view this apartment' });
    }

    return res.json(apartment);
  } catch (error) {
    return next(error);
  }
};

// @desc    Create apartment
// @route   POST /api/apartments
// @access  Private
const createApartment = async (req, res, next) => {
  try {
    // Only admin and agent can create listings
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Only admins and agents can create listings' });
    }

    const apartmentData = {
      ...req.body,
      owner: req.user._id,
      lastUpdated: new Date(),
    };

    // If this is an external listing, ensure we have the source information
    if (apartmentData.sourceUrl) {
      apartmentData.sourceType = apartmentData.sourceType || 'other';
      apartmentData.externalId =
        apartmentData.externalId || apartmentData.sourceUrl.split('/').pop().split('#')[0];
    }

    const apartment = await Apartment.create(apartmentData);

    const populatedApartment = await Apartment.findById(apartment._id).populate(
      'owner',
      'name email'
    );
    return res.status(201).json(populatedApartment);
  } catch (error) {
    return next(error);
  }
};

// @desc    Update apartment
// @route   PUT /api/apartments/:id
// @access  Private
const updateApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id);

    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    // Check permissions
    if (apartment.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this apartment' });
    }

    // Only admins can change isPublic status
    if (req.body.isPublic !== undefined && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only admins can change the public status of listings' });
    }

    // Update the lastUpdated timestamp
    req.body.lastUpdated = new Date();

    const updatedApartment = await Apartment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    return res.json(updatedApartment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }
    console.error('Error in updateApartment:', error);
    return res.status(500).json({ error: 'Error updating apartment', details: error.message });
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

    // Check ownership and role
    if (apartment.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this apartment' });
    }

    await apartment.deleteOne();

    return res.json({ message: 'Apartment removed' });
  } catch (error) {
    return next(error);
  }
};

const autofillListingFromUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Determine the source type from the URL
    let sourceType = 'other';
    if (url.includes('rightmove.co.uk')) {
      sourceType = 'rightmove';
    } else if (url.includes('zoopla.co.uk')) {
      sourceType = 'zoopla';
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    };

    const { data: html } = await axios.get(url, { headers });
    const $ = cheerio.load(html);

    // Extract data based on source type
    let extractedData = {};

    if (sourceType === 'rightmove') {
      extractedData = {
        title: $('.property-header-title').text().trim() || $('h1').first().text().trim(),
        description: $('.property-description').text().trim(),
        price: $('.property-header-price').text().trim(),
        location: $('.property-header-address').text().trim(),
        bedrooms: parseInt($('.no-of-bedrooms').text()) || 0,
        bathrooms: parseInt($('.no-of-bathrooms').text()) || 0,
        area: parseInt($('.property-size').text()) || 0,
        amenities: $('.property-features li')
          .map((i, el) => $(el).text().trim())
          .get(),
        images: $('.property-gallery img')
          .map((i, el) => $(el).attr('src'))
          .get()
          .slice(0, 4),
      };
    } else if (sourceType === 'zoopla') {
      extractedData = {
        title: $('.listing-details-title').text().trim() || $('h1').first().text().trim(),
        description: $('.listing-description').text().trim(),
        price: $('.listing-price').text().trim(),
        location: $('.listing-address').text().trim(),
        bedrooms: parseInt($('.num-beds').text()) || 0,
        bathrooms: parseInt($('.num-baths').text()) || 0,
        area: parseInt($('.listing-size').text()) || 0,
        amenities: $('.listing-features li')
          .map((i, el) => $(el).text().trim())
          .get(),
        images: $('.listing-gallery img')
          .map((i, el) => $(el).attr('src'))
          .get()
          .slice(0, 4),
      };
    } else {
      // Generic extraction for other sites
      extractedData = {
        title: $('title').first().text() || $('h1').first().text(),
        description: $('meta[name="description"]').attr('content') || '',
        price: $('[itemprop="price"], .price, .listing-price').first().text().trim(),
        location: $('[itemprop="address"], .address, .listing-address').first().text().trim(),
        bedrooms: parseInt($('[itemprop="numberOfRooms"], .bedrooms, .beds').first().text()) || 0,
        bathrooms:
          parseInt($('[itemprop="numberOfBathrooms"], .bathrooms, .baths').first().text()) || 0,
        area: parseInt($('[itemprop="floorSize"], .area, .size').first().text()) || 0,
        amenities: $('[itemprop="amenityFeature"], .amenities li, .features li')
          .map((i, el) => $(el).text().trim())
          .get(),
        images: $('img')
          .map((i, el) => {
            const src = $(el).attr('src');
            return src && src.startsWith('http') ? src : null;
          })
          .get()
          .filter(Boolean)
          .slice(0, 4),
      };
    }

    // Clean up the data
    const cleanedData = {
      ...extractedData,
      sourceUrl: url,
      sourceType,
      externalId: url.split('/').pop().split('#')[0], // Extract ID from URL
      lastUpdated: new Date(),
    };

    // Remove empty values
    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key] === null || cleanedData[key] === undefined || cleanedData[key] === '') {
        delete cleanedData[key];
      }
    });

    res.json(cleanedData);
  } catch (error) {
    console.error('Error autofilling listing:', error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Failed to fetch listing data',
        details: `Server responded with status ${error.response.status}`,
        message: 'The listing URL might be protected or no longer available',
      });
    } else if (error.request) {
      res.status(500).json({
        error: 'No response received',
        details: error.message,
        message: 'Could not connect to the listing URL',
      });
    } else {
      res.status(500).json({
        error: 'Failed to autofill listing',
        details: error.message,
      });
    }
  }
};

// Add a new function to handle image uploads
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const uploadedImages = await Promise.all(
      req.files.map(async (file) => {
        // Upload to Cloudinary or your preferred image hosting service
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'apartments',
          use_filename: true,
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
          isMain: false,
        };
      })
    );

    res.json({ images: uploadedImages });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images', details: error.message });
  }
};

module.exports = {
  getApartments,
  getApartment,
  createApartment,
  updateApartment,
  deleteApartment,
  autofillListingFromUrl,
  uploadImages,
};
