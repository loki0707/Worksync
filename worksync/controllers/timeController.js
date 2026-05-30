const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');
const { logActivity } = require('../services/activityService');

/**
 * @route POST /api/projects/:projectId/tasks/:taskId/time/start
 * @desc  Start timer for current user on a task
 */
const startTimer = asyncHandler(async (req, res, next) => {
  const { taskId, projectId } = req.params;

  // Check no active timer for this user across any task
  const activeLog = await TimeLog.findOne({ user: req.user._id, isActive: true });
  if (activeLog) {
    return next(createError(400, 'You already have an active timer. Stop it first.'));
  }

  const task = await Task.findOne({ _id: taskId, project: projectId, isDeleted: false });
  if (!task) return next(createError(404, 'Task not found'));

  const now = new Date();
  const log = await TimeLog.create({
    task: taskId, project: projectId,
    user: req.user._id, startTime: now, isActive: true,
  });

  // Also embed in task for quick lookup
  task.timeLogs.push({ user: req.user._id, startTime: now, _id: log._id });
  await task.save();

  sendSuccess(res, 201, 'Timer started', { log });
});

/**
 * @route POST /api/projects/:projectId/tasks/:taskId/time/stop
 * @desc  Stop current user's active timer on this task
 */
const stopTimer = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const { note = '' } = req.body;

  const log = await TimeLog.findOne({ task: taskId, user: req.user._id, isActive: true });
  if (!log) return next(createError(404, 'No active timer for this task'));

  const now = new Date();
  const duration = Math.round((now - log.startTime) / 1000);
  log.endTime = now;
  log.duration = duration;
  log.note = note;
  log.isActive = false;
  await log.save();

  // Update task total time
  const task = await Task.findById(taskId);
  task.totalTime = (task.totalTime || 0) + duration;
  const embedded = task.timeLogs.id(log._id);
  if (embedded) { embedded.endTime = now; embedded.duration = duration; embedded.note = note; }
  await task.save();

  sendSuccess(res, 200, 'Timer stopped', { log, totalTime: task.totalTime });
});

/**
 * @route GET /api/projects/:projectId/tasks/:taskId/time
 * @desc  Get all time logs for a task
 */
const getTaskTimeLogs = asyncHandler(async (req, res) => {
  const logs = await TimeLog.find({ task: req.params.taskId })
    .populate('user', 'name email avatar')
    .sort({ startTime: -1 })
    .lean();

  // Sum per user
  const byUser = {};
  logs.forEach(l => {
    const uid = l.user._id.toString();
    if (!byUser[uid]) byUser[uid] = { user: l.user, totalSeconds: 0, sessions: 0 };
    byUser[uid].totalSeconds += l.duration || 0;
    byUser[uid].sessions += 1;
  });

  sendSuccess(res, 200, 'Time logs fetched', { logs, summary: Object.values(byUser) });
});

/**
 * @route GET /api/projects/:projectId/time/user
 * @desc  Get time logged by current user across project tasks
 */
const getUserProjectTime = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const logs = await TimeLog.find({ project: projectId, user: req.user._id, isActive: false })
    .populate('task', 'title taskNumber')
    .sort({ startTime: -1 })
    .lean();

  const total = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
  sendSuccess(res, 200, 'User time fetched', { logs, totalSeconds: total });
});

module.exports = { startTimer, stopTimer, getTaskTimeLogs, getUserProjectTime };
