const express = require('express');
const router = express.Router();
const {
  createProject, getProjects, getProject,
  updateProject, deleteProject,
  addMember, updateMemberRole, removeMember, getReviewers,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/authorization');
const { createProjectValidator, addMemberValidator } = require('../middleware/validation');

router.use(protect);

router.route('/').post(createProjectValidator, createProject).get(getProjects);

router.route('/:projectId')
  .get(requireProjectMember, getProject)
  .put(requireProjectMember, requireProjectAdmin, updateProject)
  .delete(requireProjectMember, requireProjectAdmin, deleteProject);

router.post('/:projectId/members', requireProjectMember, requireProjectAdmin, addMember);
router.get('/:projectId/reviewers', requireProjectMember, getReviewers);
router.put('/:projectId/members/:userId', requireProjectMember, requireProjectAdmin, updateMemberRole);
router.delete('/:projectId/members/:userId', requireProjectMember, requireProjectAdmin, removeMember);

module.exports = router;
