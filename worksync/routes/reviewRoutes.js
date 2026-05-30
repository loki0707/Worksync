const express = require('express');
const router = express.Router({ mergeParams: true });
const { submitForReview, reviewAction, addReviewer, getReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');
const { reviewActionValidator } = require('../middleware/validation');

router.use(protect, requireProjectMember);
router.get('/', getReviews);
router.post('/submit', submitForReview);
router.post('/:reviewId/action', reviewActionValidator, reviewAction);
router.post('/:reviewId/add-reviewer', addReviewer);
module.exports = router;
