const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler, sendSuccess } = require('../utils/error');

/**
 * @route   GET /api/users/search?q=john
 * @desc    Search users by name or email (for adding to projects)
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;

  if (q.length < 2) {
    return sendSuccess(res, 200, 'Users fetched', { users: [] });
  }

  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user._id }, // Exclude self
    isActive: true,
  })
    .select('name email avatar')
    .limit(10)
    .lean();

  sendSuccess(res, 200, 'Users fetched', { users });
});

router.get('/search', protect, searchUsers);

module.exports = router;
