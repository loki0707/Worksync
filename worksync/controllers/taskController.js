const Task = require('../models/Task');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');
const { logActivity } = require('../services/activityService');
const { notifyTaskAssigned } = require('../services/notificationService');
const { getNextTaskNumber } = require('../services/taskNumberService');
const { emitTaskUpdate } = require('../config/socket');

// ─── Create ───────────────────────────────────────────────────────────────────
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, assignee, dueDate,
          labels, githubPR, dependencies, recurrence } = req.body;
  const { projectId } = req.params;
  const taskNumber = await getNextTaskNumber(projectId);

  const task = await Task.create({
    title, description, project: projectId, taskNumber,
    status: status || 'TODO', priority: priority || 'MEDIUM',
    assignee: assignee || null, reporter: req.user._id,
    dueDate: dueDate || null, labels: labels || [],
    githubPR: githubPR || null,
    dependencies: dependencies || [],
    recurrence: recurrence || {},
  });

  await task.populate([
    { path: 'assignee', select: 'name email avatar' },
    { path: 'reporter', select: 'name email avatar' },
    { path: 'dependencies', select: 'title taskNumber status' },
  ]);

  logActivity({ project: projectId, task: task._id, user: req.user._id, action: 'TASK_CREATED',
    meta: { taskTitle: task.title, taskNumber: task.taskNumber } });

  if (assignee && assignee.toString() !== req.user._id.toString()) {
    notifyTaskAssigned(req.io, { assigneeId: assignee, assignerName: req.user.name,
      taskTitle: task.title, projectId, taskId: task._id });
  }
  emitTaskUpdate(req.io, projectId, 'task_created', task);
  sendSuccess(res, 201, 'Task created', { task });
});

// ─── List with advanced filters ───────────────────────────────────────────────
const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assignee, search, dueBefore, dueAfter,
          labels, showDeleted, sortBy = 'createdAt', sortOrder = 'desc',
          page = 1, limit = 50 } = req.query;

  const filter = { project: projectId };

  // Soft delete filter — only admins can see deleted
  filter.isDeleted = showDeleted === 'true' ? true : false;

  if (status)    filter.status   = { $in: status.split(',') };
  if (priority)  filter.priority = { $in: priority.split(',') };
  if (assignee)  filter.assignee = assignee === 'unassigned' ? null : assignee;
  if (labels)    filter.labels   = { $in: labels.split(',') };
  if (search)    filter.$text    = { $search: search };
  if (dueBefore || dueAfter) {
    filter.dueDate = {};
    if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
    if (dueAfter)  filter.dueDate.$gte = new Date(dueAfter);
  }

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('dependencies', 'title taskNumber status')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip).limit(parseInt(limit)).lean(),
    Task.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Tasks fetched', {
    tasks,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─── Get single ───────────────────────────────────────────────────────────────
const getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId })
    .populate('assignee', 'name email avatar')
    .populate('reporter', 'name email avatar')
    .populate('dependencies', 'title taskNumber status isDeleted')
    .populate('statusHistory.changedBy', 'name email')
    .populate('versions.updatedBy', 'name email');
  if (!task) return next(createError(404, 'Task not found'));
  sendSuccess(res, 200, 'Task fetched', { task });
});

// ─── Update with version snapshot ────────────────────────────────────────────
const updateTask = asyncHandler(async (req, res, next) => {
  const { title, description, priority, assignee, dueDate, labels, githubPR, dependencies, changeNote } = req.body;
  const { projectId, taskId } = req.params;

  const task = await Task.findOne({ _id: taskId, project: projectId, isDeleted: false });
  if (!task) return next(createError(404, 'Task not found'));

  const prevAssignee = task.assignee?.toString();

  // Save version snapshot before mutating
  task.versions.push({
    version: task.currentVersion,
    updatedBy: req.user._id,
    snapshot: {
      title: task.title, description: task.description, status: task.status,
      priority: task.priority, assignee: task.assignee,
      dueDate: task.dueDate, labels: [...(task.labels || [])],
    },
    changeNote: changeNote || '',
  });
  task.currentVersion += 1;

  if (title !== undefined)        task.title = title;
  if (description !== undefined)  task.description = description;
  if (priority !== undefined)     task.priority = priority;
  if (assignee !== undefined)     task.assignee = assignee;
  if (dueDate !== undefined)      task.dueDate = dueDate;
  if (labels !== undefined)       task.labels = labels;
  if (githubPR !== undefined)     task.githubPR = githubPR;
  if (dependencies !== undefined) task.dependencies = dependencies;

  await task.save();
  await task.populate([
    { path: 'assignee', select: 'name email avatar' },
    { path: 'reporter', select: 'name email avatar' },
    { path: 'dependencies', select: 'title taskNumber status' },
  ]);

  logActivity({ project: projectId, task: task._id, user: req.user._id, action: 'TASK_UPDATED', meta: { taskTitle: task.title } });

  const newAssignee = task.assignee?._id?.toString();
  if (newAssignee && newAssignee !== prevAssignee && newAssignee !== req.user._id.toString()) {
    notifyTaskAssigned(req.io, { assigneeId: newAssignee, assignerName: req.user.name,
      taskTitle: task.title, projectId, taskId: task._id });
  }
  emitTaskUpdate(req.io, projectId, 'task_updated', task);
  sendSuccess(res, 200, 'Task updated', { task });
});

// ─── Status update with dependency check ─────────────────────────────────────
const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const { projectId, taskId } = req.params;

  const task = await Task.findOne({ _id: taskId, project: projectId, isDeleted: false })
    .populate('dependencies', 'status title taskNumber');
  if (!task) return next(createError(404, 'Task not found'));

  // Dependency gate: can't complete if blocking tasks are unfinished
  if (status === 'DONE' && task.dependencies?.length) {
    const blocking = task.dependencies.filter(d => d.status !== 'DONE' && !d.isDeleted);
    if (blocking.length) {
      return next(createError(400,
        `Cannot complete: ${blocking.length} dependency(ies) not done: ` +
        blocking.map(d => `#${d.taskNumber} ${d.title}`).join(', ')
      ));
    }
  }

  const previousStatus = task.status;
  task.status = status;
  task.statusHistory.push({ from: previousStatus, to: status, changedBy: req.user._id, changedAt: new Date() });
  await task.save();
  await task.populate('assignee', 'name email avatar');

  logActivity({ project: projectId, task: task._id, user: req.user._id, action: 'STATUS_CHANGED', meta: { from: previousStatus, to: status } });
  emitTaskUpdate(req.io, projectId, 'task_status_changed', { taskId: task._id, status, previousStatus, changedBy: req.user });
  sendSuccess(res, 200, 'Task status updated', { task });
});

// ─── Soft Delete ─────────────────────────────────────────────────────────────
const deleteTask = asyncHandler(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  const task = await Task.findOne({ _id: taskId, project: projectId, isDeleted: false });
  if (!task) return next(createError(404, 'Task not found'));

  const isReporter = task.reporter.toString() === req.user._id.toString();
  const isAdmin    = req.membership?.role === 'ADMIN';
  if (!isReporter && !isAdmin) return next(createError(403, 'Only reporter or admin can delete this task'));

  task.isDeleted = true;
  task.deletedAt = new Date();
  task.deletedBy = req.user._id;
  await task.save();

  logActivity({ project: projectId, user: req.user._id, action: 'TASK_DELETED', meta: { taskTitle: task.title } });
  emitTaskUpdate(req.io, projectId, 'task_deleted', { taskId });
  sendSuccess(res, 200, 'Task deleted (soft)');
});

// ─── Restore ──────────────────────────────────────────────────────────────────
const restoreTask = asyncHandler(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  const task = await Task.findOne({ _id: taskId, project: projectId, isDeleted: true });
  if (!task) return next(createError(404, 'Deleted task not found'));

  task.isDeleted = false; task.deletedAt = null; task.deletedBy = null;
  await task.save();

  logActivity({ project: projectId, task: task._id, user: req.user._id, action: 'TASK_UPDATED', meta: { restored: true } });
  sendSuccess(res, 200, 'Task restored', { task });
});

// ─── Version history ──────────────────────────────────────────────────────────
const getVersionHistory = asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({ _id: req.params.taskId, project: req.params.projectId })
    .populate('versions.updatedBy', 'name email avatar').lean();
  if (!task) return next(createError(404, 'Task not found'));
  sendSuccess(res, 200, 'Version history fetched', { versions: task.versions.reverse(), currentVersion: task.currentVersion });
});

module.exports = { createTask, getTasks, getTask, updateTask, updateTaskStatus, deleteTask, restoreTask, getVersionHistory };
