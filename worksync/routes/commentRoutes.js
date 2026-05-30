const express = require('express');
const router = express.Router({ mergeParams: true });
const { addComment, getComments, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');
const { commentValidator } = require('../middleware/validation');

router.use(protect, requireProjectMember);

router.route('/')
  .post(commentValidator, addComment)
  .get(getComments);

router.route('/:commentId')
  .put(commentValidator, updateComment)
  .delete(deleteComment);

module.exports = router;
