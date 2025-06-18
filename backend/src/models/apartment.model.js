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
      type: String,
      required: [true, 'Please add a location'],
      trim: true,
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
          required: true,
        },
        publicId: {
          type: String,
          required: true,
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
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location queries
apartmentSchema.index({ location: '2dsphere' });

// Add indexes for the title, price, status, and isPublic fields
apartmentSchema.index({ title: 1 });
apartmentSchema.index({ price: 1 });
apartmentSchema.index({ status: 1 });
apartmentSchema.index({ isPublic: 1 });

// Add index for faster queries
apartmentSchema.index({ owner: 1, status: 1 });
apartmentSchema.index({ sourceUrl: 1, externalId: 1 }, { sparse: true });

const Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment;
