const Apartment = require('../models/apartment.model');
const cacheManager = require('../config/cache');
const axios = require('axios');
const cheerio = require('cheerio');
const cloudinary = require('cloudinary');

// AI-OPTIMIZED: Query builder for apartment filters with role-based access
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

// @desc    Get all apartments with caching
// @route   GET /api/apartments
// @access  Public
const getApartments = async (req, res) => {
  try {
    // AI-OPTIMIZED: Generate cache key based on query parameters and user role
    const cacheKey = `apartments:${JSON.stringify(req.query)}:${req.user?.role || 'public'}:${
      req.user?._id || 'anonymous'
    }`;

    // AI-OPTIMIZED: Check cache first for better performance
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = buildApartmentQuery(req);

    // Execute query with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // AI-OPTIMIZED: Use lean() for read-only queries to improve performance
    const apartments = await Apartment.find(query)
      .select(
        'title price location bedrooms bathrooms area amenities images owner status isPublic createdAt'
      )
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Apartment.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const result = {
      apartments,
      page,
      pages,
      total,
    };

    // AI-OPTIMIZED: Cache the result with optimized TTL based on query complexity
    const ttl = Object.keys(req.query).length > 0 ? 300 : 600; // 5 min for filtered, 10 min for all
    cacheManager.set(cacheKey, result, ttl);

    return res.json(result);
  } catch (error) {
    console.error('Error in getApartments:', error);
    return res.status(500).json({ message: 'Error fetching apartments', error: error.message });
  }
};

// @desc    Get single apartment with caching
// @route   GET /api/apartments/:id
// @access  Public
const getApartment = async (req, res, next) => {
  try {
    // AI-OPTIMIZED: Generate cache key for individual apartment
    const cacheKey = `apartment:${req.params.id}:${req.user?.role || 'public'}:${
      req.user?._id || 'anonymous'
    }`;

    // AI-OPTIMIZED: Check cache first
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // AI-OPTIMIZED: Use lean() for read-only query
    const apartment = await Apartment.findById(req.params.id)
      .populate('owner', 'name email')
      .lean();

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

    // AI-OPTIMIZED: Cache the result for 10 minutes
    cacheManager.set(cacheKey, apartment, 600);

    return res.json(apartment);
  } catch (error) {
    return next(error);
  }
};

// @desc    Create apartment with cache invalidation
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

    // AI-OPTIMIZED: Invalidate related cache entries
    cacheManager.invalidateApartments();

    return res.status(201).json(populatedApartment);
  } catch (error) {
    return next(error);
  }
};

// @desc    Update apartment with cache invalidation
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

    // AI-OPTIMIZED: Invalidate related cache entries
    cacheManager.invalidateApartments();

    return res.json(updatedApartment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.message });
    }
    console.error('Error in updateApartment:', error);
    return res.status(500).json({ error: 'Error updating apartment', details: error.message });
  }
};

// @desc    Delete apartment with cache invalidation
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

    // AI-OPTIMIZED: Invalidate related cache entries
    cacheManager.invalidateApartments();

    return res.json({ message: 'Apartment removed' });
  } catch (error) {
    return next(error);
  }
};

const autofillListingFromUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // AI-OPTIMIZED: Enhanced scraper with multiple extraction methods
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    // AI-OPTIMIZED: Determine source type and extract data accordingly
    let extractedData = {};
    let sourceType = 'other';

    if (url.includes('rightmove.co.uk')) {
      sourceType = 'rightmove';
      extractedData = await extractRightmoveData($);
    } else if (url.includes('zoopla.co.uk')) {
      sourceType = 'zoopla';
      extractedData = await extractZooplaData($);
    } else {
      // Generic extraction for other sites
      extractedData = await extractGenericData($);
    }

    // AI-OPTIMIZED: Validate extracted data
    if (!extractedData.title || 
        !extractedData.description || 
        (extractedData.price === 0 && extractedData.bedrooms === 0 && extractedData.bathrooms === 0)) {
      return res.status(404).json({
        error: 'Could not extract property data from this URL',
        message: 'This website is unsupported or the page structure has changed. Please try another URL from Rightmove, Zoopla, OnTheMarket, SpareRoom, or Gumtree.',
        supportedSites: ['Rightmove', 'Zoopla', 'OnTheMarket', 'SpareRoom', 'Gumtree'],
        bestSupport: 'Rightmove'
      });
    }

    // AI-OPTIMIZED: Clean and format the data
    const autofilledData = {
      ...extractedData,
      sourceUrl: url,
      sourceType,
      externalId: url.split('/').pop().split('#')[0].split('?')[0],
      lastUpdated: new Date(),
    };

    res.json(autofilledData);
  } catch (error) {
    console.error('Error in autofillListingFromUrl:', error.message);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      if (error.response.status === 403) {
        return res.status(403).json({
          error: 'Access denied by website',
          message: 'This website blocks automated requests. Please try another URL from Rightmove, Zoopla, OnTheMarket, SpareRoom, or Gumtree.',
          supportedSites: ['Rightmove', 'Zoopla', 'OnTheMarket', 'SpareRoom', 'Gumtree'],
          bestSupport: 'Rightmove'
        });
      } else if (error.response.status === 404) {
        return res.status(404).json({
          error: 'Page not found',
          message: 'The URL may be invalid or the listing has been removed. Please try another URL from Rightmove, Zoopla, OnTheMarket, SpareRoom, or Gumtree.',
          supportedSites: ['Rightmove', 'Zoopla', 'OnTheMarket', 'SpareRoom', 'Gumtree'],
          bestSupport: 'Rightmove'
        });
      }
    }
    
    res.status(500).json({
      error: 'Failed to autofill listing',
      details: error.message,
      message: 'Please try another URL from Rightmove, Zoopla, OnTheMarket, SpareRoom, or Gumtree.',
      supportedSites: ['Rightmove', 'Zoopla', 'OnTheMarket', 'SpareRoom', 'Gumtree'],
      bestSupport: 'Rightmove'
    });
  }
};

// AI-OPTIMIZED: Rightmove extraction (most reliable)
const extractRightmoveData = async ($) => {
  try {
    const scriptTag = $('script')
      .filter((i, el) => {
        return $(el).html().includes('window.PAGE_MODEL');
      })
      .html();

    if (!scriptTag) {
      return {};
    }

    const startIndex = scriptTag.indexOf('window.PAGE_MODEL = ') + 'window.PAGE_MODEL = '.length;
    const jsonStart = scriptTag.indexOf('{', startIndex);
    
    let braceCount = 0;
    let jsonEnd = jsonStart;
    for (let i = jsonStart; i < scriptTag.length; i++) {
      if (scriptTag[i] === '{') braceCount++;
      if (scriptTag[i] === '}') braceCount--;
      if (braceCount === 0) {
        jsonEnd = i + 1;
        break;
      }
    }
    
    const jsonString = scriptTag.substring(jsonStart, jsonEnd);
    const pageModel = JSON.parse(jsonString);
    const propertyData = pageModel.propertyData;

    let price = 0;
    if (propertyData.prices && propertyData.prices.primaryPrice) {
      const match = propertyData.prices.primaryPrice.match(/([\d,]+)\s*pcm/i);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ''), 10);
      } else {
        const fallback = propertyData.prices.primaryPrice.match(/([\d,]+)/);
        if (fallback) {
          price = parseInt(fallback[1].replace(/,/g, ''), 10);
        }
      }
    }

    return {
      title: propertyData.text.pageTitle || '',
      description: propertyData.text.description.split('<br />').join('\n') || '',
      price,
      bedrooms: propertyData.bedrooms || 0,
      bathrooms: propertyData.bathrooms || 0,
      area: propertyData.sizings[1] ? propertyData.sizings[1].minimumSize : 0,
      amenities: propertyData.keyFeatures || [],
      images: propertyData.images.map((img) => img.url) || [],
      location: {
        type: 'Point',
        coordinates: [
          propertyData.location.longitude,
          propertyData.location.latitude,
        ],
      },
      address: propertyData.address.displayAddress || '',
      postcode: `${propertyData.address.outcode} ${propertyData.address.incode}`,
    };
  } catch (error) {
    console.error('Rightmove extraction failed:', error.message);
    return {};
  }
};

// AI-OPTIMIZED: Helper functions for data extraction
const extractPrice = (priceText) => {
  if (!priceText) return 0;
  const match = priceText.match(/([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
};

const extractNumber = (text) => {
  if (!text) return 0;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

// AI-OPTIMIZED: Zoopla extraction
const extractZooplaData = async ($) => {
  try {
    return {
      title: $('h1').first().text().trim() || $('title').text().trim(),
      description: $('.listing-description, .description, [data-testid="description"]').text().trim(),
      price: extractPrice($('.listing-price, .price, [data-testid="price"]').text()),
      bedrooms: extractNumber($('.num-beds, .bedrooms, [data-testid="bedrooms"]').text()),
      bathrooms: extractNumber($('.num-baths, .bathrooms, [data-testid="bathrooms"]').text()),
      area: extractNumber($('.listing-size, .area, [data-testid="area"]').text()),
      amenities: $('.listing-features li, .features li, [data-testid="features"] li').map((i, el) => $(el).text().trim()).get(),
      images: $('.listing-gallery img, .gallery img, [data-testid="images"] img').map((i, el) => $(el).attr('src')).get().filter(Boolean),
      address: $('.listing-address, .address, [data-testid="address"]').text().trim(),
    };
  } catch (error) {
    console.error('Zoopla extraction failed:', error.message);
    return {};
  }
};

// AI-OPTIMIZED: OnTheMarket extraction
const extractOnTheMarketData = async ($) => {
  try {
    return {
      title: $('h1').first().text().trim() || $('title').text().trim(),
      description: $('.description, .property-description, [data-testid="description"]').text().trim(),
      price: extractPrice($('.price, .property-price, [data-testid="price"]').text()),
      bedrooms: extractNumber($('.bedrooms, .property-bedrooms, [data-testid="bedrooms"]').text()),
      bathrooms: extractNumber($('.bathrooms, .property-bathrooms, [data-testid="bathrooms"]').text()),
      area: extractNumber($('.area, .property-area, [data-testid="area"]').text()),
      amenities: $('.features li, .property-features li, [data-testid="features"] li').map((i, el) => $(el).text().trim()).get(),
      images: $('.gallery img, .property-gallery img, [data-testid="images"] img').map((i, el) => $(el).attr('src')).get().filter(Boolean),
      address: $('.address, .property-address, [data-testid="address"]').text().trim(),
    };
  } catch (error) {
    console.error('OnTheMarket extraction failed:', error.message);
    return {};
  }
};

// AI-OPTIMIZED: SpareRoom extraction
const extractSpareRoomData = async ($) => {
  try {
    return {
      title: $('h1').first().text().trim() || $('title').text().trim(),
      description: $('.description, .room-description, [data-testid="description"]').text().trim(),
      price: extractPrice($('.price, .room-price, [data-testid="price"]').text()),
      bedrooms: extractNumber($('.bedrooms, .room-bedrooms, [data-testid="bedrooms"]').text()),
      bathrooms: extractNumber($('.bathrooms, .room-bathrooms, [data-testid="bathrooms"]').text()),
      area: extractNumber($('.area, .room-area, [data-testid="area"]').text()),
      amenities: $('.features li, .room-features li, [data-testid="features"] li').map((i, el) => $(el).text().trim()).get(),
      images: $('.gallery img, .room-gallery img, [data-testid="images"] img').map((i, el) => $(el).attr('src')).get().filter(Boolean),
      address: $('.address, .room-address, [data-testid="address"]').text().trim(),
    };
  } catch (error) {
    console.error('SpareRoom extraction failed:', error.message);
    return {};
  }
};

// AI-OPTIMIZED: Gumtree extraction
const extractGumtreeData = async ($) => {
  try {
    return {
      title: $('h1').first().text().trim() || $('title').text().trim(),
      description: $('.description, .ad-description, [data-testid="description"]').text().trim(),
      price: extractPrice($('.price, .ad-price, [data-testid="price"]').text()),
      bedrooms: extractNumber($('.bedrooms, .ad-bedrooms, [data-testid="bedrooms"]').text()),
      bathrooms: extractNumber($('.bathrooms, .ad-bathrooms, [data-testid="bathrooms"]').text()),
      area: extractNumber($('.area, .ad-area, [data-testid="area"]').text()),
      amenities: $('.features li, .ad-features li, [data-testid="features"] li').map((i, el) => $(el).text().trim()).get(),
      images: $('.gallery img, .ad-gallery img, [data-testid="images"] img').map((i, el) => $(el).attr('src')).get().filter(Boolean),
      address: $('.address, .ad-address, [data-testid="address"]').text().trim(),
    };
  } catch (error) {
    console.error('Gumtree extraction failed:', error.message);
    return {};
  }
};

// AI-OPTIMIZED: Generic extraction for other sites
const extractGenericData = async ($) => {
  try {
    return {
      title: $('title').first().text().trim() || $('h1').first().text().trim(),
      description: $('meta[name="description"]').attr('content') || $('.description, .content').first().text().trim(),
      price: extractPrice($('[itemprop="price"], .price, .listing-price').first().text()),
      bedrooms: extractNumber($('[itemprop="numberOfRooms"], .bedrooms, .beds').first().text()),
      bathrooms: extractNumber($('[itemprop="numberOfBathrooms"], .bathrooms, .baths').first().text()),
      area: extractNumber($('[itemprop="floorSize"], .area, .size').first().text()),
      amenities: $('[itemprop="amenityFeature"], .amenities li, .features li').map((i, el) => $(el).text().trim()).get(),
      images: $('img').map((i, el) => {
        const src = $(el).attr('src');
        return src && src.startsWith('http') ? src : null;
      }).get().filter(Boolean).slice(0, 4),
      address: $('[itemprop="address"], .address, .listing-address').first().text().trim(),
    };
  } catch (error) {
    console.error('Generic extraction failed:', error.message);
    return {};
  }
};

// @desc    Upload images for apartment listings
// @route   POST /api/apartments/upload-images
// @access  Private
const uploadImages = async (req, res) => {
  try {
    // Check if user is authorized to upload images
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Only admins and agents can upload images' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Limit to 4 images per upload
    if (req.files.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 images allowed per upload' });
    }

    const cloudinary = require('../config/cloudinary');
    const uploadedImages = [];

    // Process each uploaded file
    for (const file of req.files) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'apartments',
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          resource_type: 'image',
          transformation: [{ width: 800, height: 600, crop: 'limit' }, { quality: 'auto:good' }],
        });

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
          filename: file.originalname,
          size: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
        });
      } catch (uploadError) {
        console.error(`Error uploading file ${file.originalname}:`, uploadError);
        // Include the actual error message for testability
        uploadedImages.push({
          error: `Failed to upload ${file.originalname}: ${
            uploadError && uploadError.message ? uploadError.message : uploadError
          }`,
          filename: file.originalname,
        });
      }
    }

    // Check if any images were successfully uploaded
    const successfulUploads = uploadedImages.filter((img) => !img.error);
    if (successfulUploads.length === 0) {
      return res.status(500).json({
        error: 'Failed to upload any images',
        details: uploadedImages.map((img) => img.error).filter(Boolean),
      });
    }

    return res.json({
      success: true,
      message: `Successfully uploaded ${successfulUploads.length} image(s)`,
      images: uploadedImages,
      uploadedCount: successfulUploads.length,
      failedCount: uploadedImages.length - successfulUploads.length,
    });
  } catch (error) {
    console.error('Error in uploadImages:', error);
    return res.status(500).json({
      error: 'Failed to upload images',
      details: error.message,
    });
  }
};

// @desc    Calculate and save commuting distance for an apartment
// @route   POST /api/apartments/:id/commute
// @access  Private
const calculateCommuteDistance = async (req, res) => {
  try {
    const { destination, mode = 'driving' } = req.body;
    const { id } = req.params;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Get apartment
    const apartment = await Apartment.findById(id);
    if (!apartment) {
      return res.status(404).json({ error: 'Apartment not found' });
    }

    // Check if user has permission to update this apartment
    if (req.user.role !== 'admin' && apartment.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this apartment' });
    }

    // Use the commute controller to get commute time
    const commuteController = require('./commute.controller');

    // Create a mock request object for the commute controller
    const mockReq = {
      body: {
        apartmentId: id,
        destination,
        mode,
      },
    };

    const mockRes = {
      json: (data) => {
        if (data.success && data.data) {
          // Update apartment with commute information
          apartment.commutingDistance = data.data.duration || null;
          apartment.commuteMode = mode;
          apartment.commuteDestination = destination;

          apartment
            .save()
            .then(() => {
              res.json({
                success: true,
                message: 'Commute distance calculated and saved',
                data: {
                  commutingDistance: apartment.commutingDistance,
                  commuteMode: apartment.commuteMode,
                  commuteDestination: apartment.commuteDestination,
                  commuteInfo: data.data,
                },
              });
            })
            .catch((saveError) => {
              console.error('Error saving apartment:', saveError);
              res.status(500).json({ error: 'Failed to save commute information' });
            });
        } else {
          res.status(500).json({ error: 'Failed to calculate commute distance' });
        }
      },
      status: (code) => ({
        json: (data) => res.status(code).json(data),
      }),
    };

    // Call the commute controller
    await commuteController.getCommuteTime(mockReq, mockRes);
  } catch (error) {
    console.error('Error calculating commute distance:', error);
    res.status(500).json({
      error: 'Failed to calculate commute distance',
      details: error.message,
    });
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
  calculateCommuteDistance,
};
