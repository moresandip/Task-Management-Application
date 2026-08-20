const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Signs and returns a JWT containing the user's _id.
 * The token expires according to JWT_EXPIRES_IN env var (default 7d).
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409);
      throw new Error('An account with that email already exists');
    }

    // Create the user — password hashing is handled by the pre('save') hook in User.js
    const user = await User.create({ name, email, password });

    // Automatically seed rich sample tasks for the new user
    try {
      const { seedSampleTasksForUser } = require('./taskController');
      await seedSampleTasksForUser(user._id);
    } catch (seedErr) {
      console.warn('Could not auto-seed tasks:', seedErr.message);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide your email and password');
    }

    // Explicitly include password since User schema has select: false on it
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  // req.user is attached by the protect middleware
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    createdAt: req.user.createdAt,
  });
};

module.exports = { register, login, getMe };
