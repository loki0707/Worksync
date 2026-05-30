const ActivityLog = require('../models/ActivityLog');

/**
 * ActivityLog Service
 * Central service for recording all actions across the system.
 * Always fire-and-forget (no await needed at call sites) unless you need the result.
 */

/**
 * Log an action
 * @param {Object} params
 * @param {string} params.project   - Project ObjectId
 * @param {string} [params.task]    - Task ObjectId (optional)
 * @param {string} params.user      - User ObjectId who performed the action
 * @param {string} params.action    - One of the action enum values
 * @param {Object} [params.meta]    - Extra context (e.g. { from: 'TODO', to: 'DONE' })
 */
const logActivity = async ({ project, task = null, user, action, meta = {} }) => {
  try {
    await ActivityLog.create({ project, task, user, action, meta });
  } catch (err) {
    // Activity logging should never crash the main request
    console.error('⚠️  Failed to log activity:', err.message);
  }
};

/**
 * Get activity logs for a project, optionally filtered by task or user
 */
const getProjectActivity = async (projectId, { taskId, userId, limit = 50, skip = 0 } = {}) => {
  const filter = { project: projectId };
  if (taskId) filter.task = taskId;
  if (userId) filter.user = userId;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'name email avatar')
      .populate('task', 'title taskNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return { logs, total };
};

module.exports = { logActivity, getProjectActivity };
