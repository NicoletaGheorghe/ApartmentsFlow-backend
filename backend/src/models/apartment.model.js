const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
      },
    },
    bedrooms: {
      type: Number,
      required: [true, 'Please add number of bedrooms'],
      min: [0, 'Number of bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Please add number of bathrooms'],
      min: [0, 'Number of bathrooms cannot be negative'],
    },
    area: {
      type: Number,
      required: [true, 'Please add the area'],
      min: [0, 'Area cannot be negative'],
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: function () {
            return this.images && this.images.length > 0;
          },
        },
        publicId: {
          type: String,
          required: function () {
            return this.images && this.images.length > 0;
          },
        },
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'rented', 'pending'],
      default: 'available',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    // New fields for external listings
    sourceUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Source URL must be a valid URL',
      },
    },
    sourceType: {
      type: String,
      enum: ['manual', 'rightmove', 'zoopla', 'other'],
      default: 'manual',
    },
    externalId: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    // New fields for enhanced listing information
    neighborhoodRating: {
      type: Number,
      min: [1, 'Neighborhood rating must be at least 1'],
      max: [10, 'Neighborhood rating cannot exceed 10'],
      validate: {
        validator: function (v) {
          return !v || (v >= 1 && v <= 10);
        },
        message: 'Neighborhood rating must be between 1 and 10',
      },
    },
    commutingDistance: {
      type: Number,
      min: [0, 'Commuting distance cannot be negative'],
      validate: {
        validator: function (v) {
          return !v || v >= 0;
        },
        message: 'Commuting distance must be a positive number',
      },
    },
    commuteMode: {
      type: String,
      enum: ['driving', 'walking', 'bicycling', 'transit'],
      default: 'driving',
    },
    commuteDestination: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || v.length >= 3;
        },
        message: 'Commute destination must be at least 3 characters long',
      },
    },
  },
  {
    timestamps: true,
  }
);

// AI-OPTIMIZED: Compound indexes for common query patterns
// Price range queries with status and public visibility
apartmentSchema.index({ price: 1, status: 1, isPublic: 1 });

// Location-based searches with price filtering
apartmentSchema.index({ location: 1, price: 1, isPublic: 1 });

// Bedroom and bathroom filtering with price
apartmentSchema.index({ bedrooms: 1, bathrooms: 1, price: 1, isPublic: 1 });

// Owner-based queries with status
apartmentSchema.index({ owner: 1, status: 1 });

// External listing lookups
apartmentSchema.index({ sourceUrl: 1, externalId: 1 }, { sparse: true });

// Commute-based searches
apartmentSchema.index({ commuteMode: 1, commutingDistance: 1, isPublic: 1 });

// Neighborhood rating with price
apartmentSchema.index({ neighborhoodRating: 1, price: 1, isPublic: 1 });

// Timestamp-based queries for recent listings
apartmentSchema.index({ createdAt: -1, isPublic: 1 });

// Single field indexes for individual queries
apartmentSchema.index({ title: 1 });
apartmentSchema.index({ status: 1 });
apartmentSchema.index({ isPublic: 1 });

// Add after all other indexes
apartmentSchema.index({ location: '2dsphere' });

const Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment;
