const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email already registered
  const existing = await User.findOne({ email });
  if (existing) return next(createError(409, 'Email already registered'));

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  sendSuccess(res, 201, 'Registration successful', {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login with email + password
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(createError(401, 'Invalid email or password'));
  }

  if (!user.isActive) {
    return next(createError(401, 'Your account has been deactivated'));
  }

  const token = generateToken(user._id);

  sendSuccess(res, 200, 'Login successful', {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, 200, 'Profile fetched', { user });
});

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile (name, bio, avatar)
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, bio, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, bio, avatar },
    { new: true, runValidators: true }
  );
  sendSuccess(res, 200, 'Profile updated', { user });
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(createError(401, 'Current password is incorrect'));
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id);
  sendSuccess(res, 200, 'Password changed successfully', { token });
});

module.exports = { register, login, getMe, updateMe, changePassword };
