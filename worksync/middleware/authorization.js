const ProjectMember = require('../models/ProjectMember');
const Project = require('../models/Project');
const { createError } = require('../utils/error');

/**
 * Attach req.project + req.membership to every project-scoped request.
 * Owner is always treated as ADMIN regardless of the membership record.
 */
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.project;
    const project = await Project.findById(projectId);
    if (!project) return next(createError(404, 'Project not found'));

    // Owner implicit ADMIN
    if (project.owner.toString() === req.user._id.toString()) {
      req.project = project;
      req.membership = { role: 'ADMIN' };
      return next();
    }

    const membership = await ProjectMember.findOne({ project: projectId, user: req.user._id });
    if (!membership) return next(createError(403, 'You are not a member of this project'));

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) { next(err); }
};

/** Only ADMIN */
const requireProjectAdmin = (req, res, next) => {
  if (req.membership?.role === 'ADMIN') return next();
  next(createError(403, 'This action requires project admin privileges'));
};

/** ADMIN or DEVELOPER */
const requireDeveloper = (req, res, next) => {
  const role = req.membership?.role;
  if (role === 'ADMIN' || role === 'DEVELOPER') return next();
  next(createError(403, 'Developers and Admins only'));
};

/** ADMIN or REVIEWER */
const requireReviewer = (req, res, next) => {
  const role = req.membership?.role;
  if (role === 'ADMIN' || role === 'REVIEWER') return next();
  next(createError(403, 'Reviewers and Admins only'));
};

module.exports = { requireProjectMember, requireProjectAdmin, requireDeveloper, requireReviewer };
