const Notification = require('../models/Notification');
const { emitNotification } = require('../config/socket');

/**
 * Notification Service
 * Creates DB notifications and pushes them via Socket.IO in real-time.
 */

/**
 * Create and emit a notification
 * @param {Object} io         - Socket.IO server instance
 * @param {Object} params
 * @param {string} params.recipient - User ObjectId to notify
 * @param {string} [params.sender]  - User ObjectId who triggered it
 * @param {string} params.type      - Notification type enum
 * @param {string} params.title     - Short title
 * @param {string} params.message   - Full message
 * @param {string} [params.link]    - Deep link path
 */
const createNotification = async (io, { recipient, sender = null, type, title, message, link = null }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
    });

    // Real-time push (non-blocking)
    if (io) {
      const populated = await notification.populate('sender', 'name avatar');
      emitNotification(io, recipient.toString(), populated);
    }

    return notification;
  } catch (err) {
    console.error('⚠️  Failed to create notification:', err.message);
  }
};

/**
 * Notify when a task is assigned to a user
 */
const notifyTaskAssigned = (io, { assigneeId, assignerName, taskTitle, projectId, taskId }) => {
  return createNotification(io, {
    recipient: assigneeId,
    type: 'TASK_ASSIGNED',
    title: 'Task Assigned to You',
    message: `${assignerName} assigned you to task: "${taskTitle}"`,
    link: `/projects/${projectId}/tasks/${taskId}`,
  });
};

/**
 * Notify reviewer when a review is requested
 */
const notifyReviewRequested = (io, { reviewerId, submitterName, taskTitle, projectId, taskId }) => {
  return createNotification(io, {
    recipient: reviewerId,
    type: 'REVIEW_REQUESTED',
    title: 'Code Review Requested',
    message: `${submitterName} requested your review on: "${taskTitle}"`,
    link: `/projects/${projectId}/tasks/${taskId}`,
  });
};

/**
 * Notify task assignee when review is approved
 */
const notifyReviewApproved = (io, { assigneeId, reviewerName, taskTitle, projectId, taskId }) => {
  return createNotification(io, {
    recipient: assigneeId,
    type: 'REVIEW_APPROVED',
    title: 'Review Approved',
    message: `${reviewerName} approved your task: "${taskTitle}"`,
    link: `/projects/${projectId}/tasks/${taskId}`,
  });
};

/**
 * Notify task assignee when changes are requested
 */
const notifyChangesRequested = (io, { assigneeId, reviewerName, taskTitle, projectId, taskId }) => {
  return createNotification(io, {
    recipient: assigneeId,
    type: 'REVIEW_CHANGES_REQUESTED',
    title: 'Changes Requested',
    message: `${reviewerName} requested changes on: "${taskTitle}"`,
    link: `/projects/${projectId}/tasks/${taskId}`,
  });
};

module.exports = {
  createNotification,
  notifyTaskAssigned,
  notifyReviewRequested,
  notifyReviewApproved,
  notifyChangesRequested,
};
