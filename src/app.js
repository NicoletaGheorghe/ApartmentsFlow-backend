const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/user.routes');
const apartmentRoutes = require('./routes/apartment.routes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/apartments', apartmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Sorry, can't find that" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;
