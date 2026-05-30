const express = require('express');
const router = express.Router({ mergeParams: true });
const { startTimer, stopTimer, getTaskTimeLogs, getUserProjectTime } = require('../controllers/timeController');
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/authorization');

router.use(protect, requireProjectMember);
router.post('/start', startTimer);
router.post('/stop',  stopTimer);
router.get('/',       getTaskTimeLogs);
module.exports = router;
