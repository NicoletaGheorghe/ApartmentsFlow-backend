'use strict';

/**
 * Module dependencies.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = (module.exports = express());

// create an error with .status. we
// can then use the property in our
// custom error handler (Connect respects this prop as well)
function error(status, msg) {
  const err = new Error(msg);
  err.status = status;
  return err;
}

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging

// Import routes
const authRoutes = require('./routes/auth.routes');
const apartmentRoutes = require('./routes/apartment.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const commuteRoutes = require('./routes/commute.routes');
const userRoutes = require('./routes/user.routes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/commute', commuteRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware (from Express.js web-service example)
app.use(function (err, req, res, next) {
  // whatever you want here, feel free to populate
  // properties on `err` to treat it differently in here.
  res.status(err.status || 500);
  res.json({ error: err.message });
});

// 404 handler (from Express.js web-service example)
app.use(function (req, res) {
  res.status(404);
  res.json({ error: "Sorry, can't find that" });
});

// Start server
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
