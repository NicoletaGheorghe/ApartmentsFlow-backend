const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  console.log('DEBUG: Entered register controller, body:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('DEBUG: express-validator errors:', errors.array());
    return res.status(400).json({ errors: errors.array().map((e) => e.msg) });
  }
  try {
    console.log('Register payload:', req.body);
    const { name, email, password, profileImage } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }
   const DEFAULT_AVATAR_URL = "https://res.cloudinary.com/dm2lc3vso/image/upload/v1750940090/default-avatar_dlerrd.png"

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      profileImage: profileImage?.trim() ? profileImage : DEFAULT_AVATAR_URL,

    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    // Handle Mongoose validation errors in a consistent format
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ errors: messages });
    }
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map((e) => e.msg) });
  }
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('connect.sid'); // Default cookie name for express-session
      return res.json({ message: 'Logged out successfully' });
    });
  } else {
    // For JWT, instruct client to remove token
    return res.json({ message: 'Logged out (client should remove token)' });
  }
};

// IMPORTANT: Handles user registration, login, and authentication logic
// TODO: Add rate limiting to login endpoint for extra security

module.exports = {
  register,
  login,
  getMe,
  logout,
};
