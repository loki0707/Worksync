const express = require('express');
const router = express.Router({ mergeParams: true });
const { getActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');

router.use(protect, requireProjectMember);

router.get('/', getActivity);

module.exports = router;
