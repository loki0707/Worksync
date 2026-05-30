const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  uploadAttachment,
  getAttachments,
  deleteAttachment,
} = require('../controllers/attachmentController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');
const upload = require('../middleware/upload');

router.use(protect, requireProjectMember);

router.route('/')
  .get(getAttachments)
  // upload.single('file') processes the multipart form field named "file"
  .post(upload.single('file'), uploadAttachment);

router.delete('/:attachmentId', deleteAttachment);

module.exports = router;
