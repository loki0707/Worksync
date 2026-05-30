const { body, param, query, validationResult } = require('express-validator');
const { createError } = require('../utils/error');

/**
 * Run validation rules and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    return next(createError(400, messages));
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Project Validators ───────────────────────────────────────────────────────

const createProjectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required')
    .isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),
  body('key').trim().notEmpty().withMessage('Project key is required')
    .isLength({ max: 10 }).withMessage('Key cannot exceed 10 characters')
    .isAlphanumeric().withMessage('Key must be alphanumeric'),
  body('description').optional().isLength({ max: 2000 }),
  validate,
];

// ─── Task Validators ──────────────────────────────────────────────────────────

const createTaskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required')
    .isLength({ max: 300 }).withMessage('Title cannot exceed 300 characters'),
  body('status').optional()
    .isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).withMessage('Invalid status'),
  body('priority').optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

const updateTaskValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 300 }),
  body('status').optional()
    .isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).withMessage('Invalid status'),
  body('priority').optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

// ─── Comment Validators ───────────────────────────────────────────────────────

const commentValidator = [
  body('content').trim().notEmpty().withMessage('Comment content is required')
    .isLength({ max: 5000 }).withMessage('Comment cannot exceed 5000 characters'),
  validate,
];

// ─── Review Validators ────────────────────────────────────────────────────────

const reviewActionValidator = [
  body('action').isIn(['APPROVED', 'CHANGES_REQUESTED']).withMessage('Action must be APPROVED or CHANGES_REQUESTED'),
  body('comment').optional().isLength({ max: 2000 }),
  validate,
];

// ─── Member Validators ────────────────────────────────────────────────────────

const addMemberValidator = [
  body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid user ID'),
  body('role').optional().isIn(['ADMIN', 'DEVELOPER', 'REVIEWER']).withMessage('Role must be ADMIN, DEVELOPER, or REVIEWER'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  createProjectValidator,
  createTaskValidator,
  updateTaskValidator,
  commentValidator,
  reviewActionValidator,
  addMemberValidator,
};
