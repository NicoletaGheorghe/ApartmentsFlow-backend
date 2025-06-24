const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a note title'],
      trim: true,
      maxlength: [100, 'Note title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please add note content'],
      trim: true,
      maxlength: [2000, 'Note content cannot be more than 2000 characters'],
    },
    category: {
      type: String,
      enum: ['general', 'pros', 'cons', 'visit', 'research', 'comparison', 'other'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    isPublic: {
      type: Boolean,
      default: false, // Notes are private by default
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [20, 'Tag cannot be more than 20 characters'],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// AI-OPTIMIZED: Compound indexes for common query patterns
// User-based queries with apartment
noteSchema.index({ user: 1, apartment: 1 });

// User-based queries with category
noteSchema.index({ user: 1, category: 1 });

// User-based queries with priority
noteSchema.index({ user: 1, priority: 1 });

// User-based queries with creation date
noteSchema.index({ user: 1, createdAt: -1 });

// Apartment-based queries (for public notes)
noteSchema.index({ apartment: 1, isPublic: 1 });

// Text search index for note content
noteSchema.index({ title: 'text', content: 'text' });

// Single field indexes
noteSchema.index({ category: 1 });
noteSchema.index({ priority: 1 });
noteSchema.index({ isPublic: 1 });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note; 