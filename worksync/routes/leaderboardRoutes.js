const express = require('express');
const router = express.Router({ mergeParams: true });
const { getLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');
router.use(protect, requireProjectMember);
router.get('/', getLeaderboard);
module.exports = router;
