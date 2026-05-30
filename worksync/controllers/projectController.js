const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');
const User = require('../models/User');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');
const { logActivity } = require('../services/activityService');
const { getPagination, paginatedResponse } = require('../utils/pagination');

// ── Create ────────────────────────────────────────────────────────────────────
const createProject = asyncHandler(async (req, res) => {
  const { name, key, description, startDate, endDate, githubRepo } = req.body;

  const project = await Project.create({
    name, key: key.toUpperCase(), description,
    startDate, endDate, githubRepo, owner: req.user._id,
  });

  await ProjectMember.create({ project: project._id, user: req.user._id, role: 'ADMIN' });

  logActivity({ project: project._id, user: req.user._id, action: 'PROJECT_CREATED', meta: { projectName: project.name } });
  sendSuccess(res, 201, 'Project created', { project });
});

// ── List ──────────────────────────────────────────────────────────────────────
const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
  const projectIds = memberships.map(m => m.project);

  const [projects, total] = await Promise.all([
    Project.find({ _id: { $in: projectIds } })
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments({ _id: { $in: projectIds } }),
  ]);

  // Attach caller's role to each project
  const memberMap = {};
  const allMems = await ProjectMember.find({ project: { $in: projectIds }, user: req.user._id }).lean();
  allMems.forEach(m => { memberMap[m.project.toString()] = m.role; });

  const enriched = projects.map(p => ({
    ...p,
    myRole: p.owner._id?.toString() === req.user._id.toString() ? 'ADMIN' : (memberMap[p._id.toString()] || 'DEVELOPER'),
  }));

  sendSuccess(res, 200, 'Projects fetched', paginatedResponse(enriched, total, page, limit));
});

// ── Single ────────────────────────────────────────────────────────────────────
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).populate('owner', 'name email avatar').lean();
  const members = await ProjectMember.find({ project: project._id })
    .populate('user', 'name email avatar').lean();

  sendSuccess(res, 200, 'Project fetched', { project: { ...project, members, myRole: req.membership.role } });
});

// ── Update ────────────────────────────────────────────────────────────────────
const updateProject = asyncHandler(async (req, res) => {
  const { name, description, status, startDate, endDate, githubRepo } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.projectId,
    { name, description, status, startDate, endDate, githubRepo },
    { new: true, runValidators: true }
  ).populate('owner', 'name email avatar');

  logActivity({ project: project._id, user: req.user._id, action: 'PROJECT_UPDATED', meta: { projectName: project.name } });
  sendSuccess(res, 200, 'Project updated', { project });
});

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  if (project.owner.toString() !== req.user._id.toString())
    return next(createError(403, 'Only the project owner can delete this project'));

  await Promise.all([
    ProjectMember.deleteMany({ project: project._id }),
    Task.deleteMany({ project: project._id }),
    project.deleteOne(),
  ]);
  sendSuccess(res, 200, 'Project deleted');
});

// ── Add member by email ───────────────────────────────────────────────────────
const addMember = asyncHandler(async (req, res, next) => {
  const { email, userId, role = 'DEVELOPER' } = req.body;

  let targetUser;
  if (email) {
    targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) return next(createError(404, `No user found with email "${email}"`));
  } else if (userId) {
    targetUser = await User.findById(userId);
    if (!targetUser) return next(createError(404, 'User not found'));
  } else {
    return next(createError(400, 'Provide email or userId'));
  }

  const existing = await ProjectMember.findOne({ project: req.params.projectId, user: targetUser._id });
  if (existing) return next(createError(409, `${targetUser.name} is already a member`));

  const membership = await ProjectMember.create({
    project: req.params.projectId,
    user: targetUser._id,
    role,
    invitedBy: req.user._id,
  });
  await membership.populate('user', 'name email avatar');

  logActivity({ project: req.params.projectId, user: req.user._id, action: 'MEMBER_ADDED', meta: { addedUser: targetUser.name, role } });
  sendSuccess(res, 201, 'Member added', { membership });
});

// ── Update role ───────────────────────────────────────────────────────────────
const updateMemberRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  if (!['ADMIN', 'DEVELOPER', 'REVIEWER'].includes(role))
    return next(createError(400, 'Invalid role. Use ADMIN, DEVELOPER, or REVIEWER'));

  const membership = await ProjectMember.findOneAndUpdate(
    { project: req.params.projectId, user: req.params.userId },
    { role }, { new: true }
  ).populate('user', 'name email avatar');

  if (!membership) return next(createError(404, 'Member not found'));
  logActivity({ project: req.params.projectId, user: req.user._id, action: 'MEMBER_UPDATED', meta: { targetUser: membership.user.name, newRole: role } });
  sendSuccess(res, 200, 'Role updated', { membership });
});

// ── Remove member ─────────────────────────────────────────────────────────────
const removeMember = asyncHandler(async (req, res, next) => {
  // Cannot remove project owner
  const project = await Project.findById(req.params.projectId);
  if (project.owner.toString() === req.params.userId)
    return next(createError(400, 'Cannot remove the project owner'));

  const membership = await ProjectMember.findOneAndDelete({ project: req.params.projectId, user: req.params.userId });
  if (!membership) return next(createError(404, 'Member not found'));

  logActivity({ project: req.params.projectId, user: req.user._id, action: 'MEMBER_REMOVED', meta: { removedUserId: req.params.userId } });
  sendSuccess(res, 200, 'Member removed');
});

// ── List reviewers for a project (used when submitting for review) ─────────────
const getReviewers = asyncHandler(async (req, res) => {
  const reviewers = await ProjectMember.find({
    project: req.params.projectId,
    role: { $in: ['REVIEWER', 'ADMIN'] },
  }).populate('user', 'name email avatar').lean();
  sendSuccess(res, 200, 'Reviewers fetched', { reviewers });
});

module.exports = {
  createProject, getProjects, getProject, updateProject, deleteProject,
  addMember, updateMemberRole, removeMember, getReviewers,
};
