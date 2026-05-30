const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');
const { logActivity } = require('../services/activityService');
const { emitComment } = require('../config/socket');

/**
 * @route   POST /api/projects/:projectId/tasks/:taskId/comments
 * @desc    Add a comment to a task
 * @access  Private (project member)
 */
const addComment = asyncHandler(async (req, res, next) => {
  const { taskId, projectId } = req.params;
  const { content } = req.body;

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) return next(createError(404, 'Task not found'));

  const comment = await Comment.create({
    task: taskId,
    author: req.user._id,
    content,
  });

  await comment.populate('author', 'name email avatar');

  logActivity({
    project: projectId,
    task: taskId,
    user: req.user._id,
    action: 'COMMENT_ADDED',
    meta: { commentId: comment._id },
  });

  // Broadcast new comment to all project members
  emitComment(req.io, projectId, {
    comment,
    taskId,
  });

  sendSuccess(res, 201, 'Comment added', { comment });
});

/**
 * @route   GET /api/projects/:projectId/tasks/:taskId/comments
 * @desc    Get all comments for a task (paginated, newest first)
 * @access  Private (project member)
 */
const getComments = asyncHandler(async (req, res, next) => {
  const { taskId, projectId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) return next(createError(404, 'Task not found'));

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [comments, total] = await Promise.all([
    Comment.find({ task: taskId })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Comment.countDocuments({ task: taskId }),
  ]);

  sendSuccess(res, 200, 'Comments fetched', {
    comments,
    pagination: { total, page: parseInt(page), limit: parseInt(limit) },
  });
});

/**
 * @route   PUT /api/projects/:projectId/tasks/:taskId/comments/:commentId
 * @desc    Edit a comment (author only)
 * @access  Private
 */
const updateComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return next(createError(404, 'Comment not found'));

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(createError(403, 'You can only edit your own comments'));
  }

  comment.content = req.body.content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  await comment.populate('author', 'name email avatar');

  logActivity({
    project: req.params.projectId,
    task: req.params.taskId,
    user: req.user._id,
    action: 'COMMENT_EDITED',
    meta: { commentId: comment._id },
  });

  sendSuccess(res, 200, 'Comment updated', { comment });
});

/**
 * @route   DELETE /api/projects/:projectId/tasks/:taskId/comments/:commentId
 * @desc    Delete a comment (author or project admin)
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return next(createError(404, 'Comment not found'));

  const isAuthor = comment.author.toString() === req.user._id.toString();
  const isAdmin = req.membership?.role === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    return next(createError(403, 'You cannot delete this comment'));
  }

  await comment.deleteOne();

  logActivity({
    project: req.params.projectId,
    task: req.params.taskId,
    user: req.user._id,
    action: 'COMMENT_DELETED',
    meta: { commentId: comment._id },
  });

  sendSuccess(res, 200, 'Comment deleted');
});

module.exports = { addComment, getComments, updateComment, deleteComment };
