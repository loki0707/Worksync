const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  suggestPriority,
  suggestAssignee,
  suggestTaskBreakdown,
  projectHealthCheck,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');

router.use(protect, requireProjectMember);

// Project-level AI endpoints
router.post('/suggest-priority', suggestPriority);
router.get('/suggest-assignee', suggestAssignee);
router.get('/health-check', projectHealthCheck);

// Task-level AI endpoint
router.post('/tasks/:taskId/breakdown', suggestTaskBreakdown);

module.exports = router;
