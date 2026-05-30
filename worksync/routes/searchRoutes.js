const express = require('express');
const router = express.Router();
const { searchTasks, searchProjects } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/tasks',    searchTasks);
router.get('/projects', searchProjects);

module.exports = router;
