const mongoose = require('mongoose');

const commuteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
      required: true,
    },
    destination: {
      name: {
        type: String,
        required: true,
      },
      placeId: {
        type: String,
        required: true,
      },
      location: {
        lat: Number,
        lng: Number,
      },
    },
    commuteInfo: {
      duration: String,
      distance: String,
      mode: {
        type: String,
        enum: ['driving', 'walking', 'bicycling', 'transit'],
        default: 'driving',
      },
      route: String,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
commuteSchema.index({ user: 1, apartment: 1 });
commuteSchema.index({ 'destination.placeId': 1 });

const Commute = mongoose.model('Commute', commuteSchema);

module.exports = Commute; 