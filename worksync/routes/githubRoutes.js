const express = require('express');
const router = express.Router();
const { getPRStatus } = require('../controllers/githubController');
const { protect } = require('../middleware/auth');

router.get('/pr-status', protect, getPRStatus);
module.exports = router;
