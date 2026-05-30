const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/error');

/**
 * Protect routes — validates JWT and attaches user to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(createError(401, 'Not authenticated. Please log in.'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createError(401, 'The user belonging to this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(createError(401, 'Your account has been deactivated.'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired. Please log in again.'));
    }
    next(error);
  }
};

/**
 * Generate a signed JWT for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { protect, generateToken };
