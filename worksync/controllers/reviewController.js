const Review = require('../models/Review');
const Task = require('../models/Task');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');
const { logActivity } = require('../services/activityService');
const { notifyReviewRequested, notifyReviewApproved, notifyChangesRequested } = require('../services/notificationService');

/**
 * @route POST /api/projects/:projectId/tasks/:taskId/reviews/submit
 * Developers submit task for code review (moves status to REVIEW)
 */
const submitForReview = asyncHandler(async (req, res, next) => {
  const { taskId, projectId } = req.params;
  const { githubPR, reviewerIds = [], minApprovals = 1 } = req.body;

  // Only ADMIN or DEVELOPER can submit
  const role = req.membership?.role;
  if (role === 'REVIEWER') return next(createError(403, 'Reviewers cannot submit tasks for review'));

  const task = await Task.findOne({ _id: taskId, project: projectId, isDeleted: false });
  if (!task) return next(createError(404, 'Task not found'));
  if (task.status === 'DONE') return next(createError(400, 'Task is already done'));

  const prevStatus = task.status;
  task.status = 'REVIEW';
  if (githubPR) task.githubPR = githubPR;
  task.statusHistory.push({ from: prevStatus, to: 'REVIEW', changedBy: req.user._id });
  await task.save();

  const reviewerEntries = reviewerIds.map(uid => ({ user: uid, status: 'PENDING' }));

  const review = await Review.create({
    task: taskId,
    submittedBy: req.user._id,
    reviewers: reviewerEntries,
    minApprovals: Math.max(1, minApprovals),
    githubPR: githubPR || null,
    status: 'PENDING',
    history: [{ reviewer: req.user._id, action: 'SUBMITTED', comment: 'Submitted for review' }],
  });

  await review.populate([
    { path: 'submittedBy', select: 'name email avatar' },
    { path: 'reviewers.user', select: 'name email avatar' },
  ]);

  logActivity({ project: projectId, task: taskId, user: req.user._id, action: 'REVIEW_SUBMITTED', meta: { githubPR } });

  for (const uid of reviewerIds) {
    if (uid !== req.user._id.toString()) {
      notifyReviewRequested(req.io, { reviewerId: uid, submitterName: req.user.name, taskTitle: task.title, projectId, taskId: task._id });
    }
  }

  sendSuccess(res, 201, 'Task submitted for review', { review, task });
});

/**
 * @route POST /api/projects/:projectId/tasks/:taskId/reviews/:reviewId/action
 * Reviewers APPROVE or REQUEST_CHANGES (with optional score)
 */
const reviewAction = asyncHandler(async (req, res, next) => {
  const { taskId, projectId, reviewId } = req.params;
  const { action, comment = '', codeQuality, readability } = req.body;

  // Only ADMIN or REVIEWER can act
  const role = req.membership?.role;
  if (role === 'DEVELOPER') return next(createError(403, 'Developers cannot approve/reject reviews'));

  const review = await Review.findById(reviewId);
  if (!review) return next(createError(404, 'Review not found'));
  if (review.status !== 'PENDING') return next(createError(400, 'Review already resolved'));

  const task = await Task.findOne({ _id: taskId, project: projectId, isDeleted: false });
  if (!task) return next(createError(404, 'Task not found'));

  // Find or create reviewer entry
  let entry = review.reviewers.find(r => r.user.toString() === req.user._id.toString());
  if (!entry) {
    review.reviewers.push({ user: req.user._id, status: 'PENDING' });
    entry = review.reviewers[review.reviewers.length - 1];
  }

  if (codeQuality) entry.codeQuality = codeQuality;
  if (readability) entry.readability = readability;
  const scores = [codeQuality, readability].filter(Boolean);
  entry.avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  entry.status = action;
  entry.comment = comment;
  entry.reviewedAt = new Date();

  // Recompute overall score
  const scored = review.reviewers.filter(r => r.avgScore != null);
  review.overallScore = scored.length ? scored.reduce((s, r) => s + r.avgScore, 0) / scored.length : null;

  review.history.push({ reviewer: req.user._id, action, comment, timestamp: new Date() });

  // Determine outcome
  const approvals  = review.reviewers.filter(r => r.status === 'APPROVED').length;
  const rejections = review.reviewers.filter(r => r.status === 'CHANGES_REQUESTED').length;

  if (rejections > 0) {
    review.status = 'CHANGES_REQUESTED';
    task.status = 'IN_PROGRESS';
    task.statusHistory.push({ from: 'REVIEW', to: 'IN_PROGRESS', changedBy: req.user._id });
    notifyChangesRequested(req.io, { assigneeId: review.submittedBy, reviewerName: req.user.name, taskTitle: task.title, projectId, taskId });
  } else if (approvals >= review.minApprovals) {
    review.status = 'APPROVED';
    task.status = 'DONE';
    task.statusHistory.push({ from: 'REVIEW', to: 'DONE', changedBy: req.user._id });
    notifyReviewApproved(req.io, { assigneeId: review.submittedBy, reviewerName: req.user.name, taskTitle: task.title, projectId, taskId });
  }

  await Promise.all([review.save(), task.save()]);
  await review.populate([
    { path: 'submittedBy', select: 'name email avatar' },
    { path: 'reviewers.user', select: 'name email avatar' },
    { path: 'history.reviewer', select: 'name email avatar' },
  ]);

  const logAction = action === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_CHANGES_REQUESTED';
  logActivity({ project: projectId, task: taskId, user: req.user._id, action: logAction, meta: { comment, codeQuality, readability } });

  sendSuccess(res, 200, `Review ${action.toLowerCase().replace('_', ' ')}`, { review, task });
});

/** Add reviewer to existing pending review */
const addReviewer = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;
  const { userId } = req.body;

  const role = req.membership?.role;
  if (role === 'DEVELOPER') return next(createError(403, 'Only admins and reviewers can add reviewers'));

  const review = await Review.findById(reviewId);
  if (!review) return next(createError(404, 'Review not found'));
  if (review.status !== 'PENDING') return next(createError(400, 'Review already resolved'));

  const exists = review.reviewers.some(r => r.user.toString() === userId);
  if (exists) return next(createError(409, 'User is already a reviewer'));

  review.reviewers.push({ user: userId, status: 'PENDING' });
  await review.save();
  await review.populate('reviewers.user', 'name email avatar');

  sendSuccess(res, 200, 'Reviewer added', { review });
});

/** GET all reviews for a task */
const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ task: req.params.taskId })
    .populate('submittedBy', 'name email avatar')
    .populate('reviewers.user', 'name email avatar')
    .populate('history.reviewer', 'name email avatar')
    .sort({ createdAt: -1 }).lean();
  sendSuccess(res, 200, 'Reviews fetched', { reviews });
});

module.exports = { submitForReview, reviewAction, addReviewer, getReviews };
