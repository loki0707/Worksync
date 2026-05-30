const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProjectOverview,
  getUserProductivity,
  getVelocity,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');

router.use(protect, requireProjectMember);

router.get('/overview', getProjectOverview);
router.get('/productivity', getUserProductivity);
router.get('/velocity', getVelocity);

module.exports = router;
