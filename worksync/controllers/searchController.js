const Task    = require('../models/Task');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const { asyncHandler, sendSuccess } = require('../utils/error');

/**
 * @route GET /api/search/tasks?q=term
 * @desc  Full-text task search across projects user belongs to
 */
const searchTasks = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  if (q.trim().length < 2) return sendSuccess(res, 200, 'OK', { results: [] });

  // Get user's projects
  const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
  const projectIds  = memberships.map(m => m.project);

  const tasks = await Task.find({
    project: { $in: projectIds },
    isDeleted: false,
    $or: [
      { title:       { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  })
  .populate('project', 'name key')
  .select('title taskNumber status priority project')
  .limit(10)
  .lean();

  sendSuccess(res, 200, 'Tasks found', { results: tasks });
});

/**
 * @route GET /api/search/projects?q=term
 */
const searchProjects = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  if (q.trim().length < 2) return sendSuccess(res, 200, 'OK', { results: [] });

  const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
  const projectIds  = memberships.map(m => m.project);

  const projects = await Project.find({
    _id: { $in: projectIds },
    $or: [
      { name:        { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  }).select('name key status').limit(8).lean();

  sendSuccess(res, 200, 'Projects found', { results: projects });
});

module.exports = { searchTasks, searchProjects };
