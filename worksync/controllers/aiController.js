const Task = require('../models/Task');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');

/**
 * AI Suggestions Controller
 *
 * Currently a structured mock implementation.
 * To integrate a real AI service (e.g. OpenAI, Claude API), replace
 * the mock logic in each handler with actual API calls using process.env.AI_API_KEY.
 */

/**
 * @route   POST /api/projects/:projectId/ai/suggest-priority
 * @desc    Suggest a priority level for a task based on its title and description
 * @access  Private (project member)
 */
const suggestPriority = asyncHandler(async (req, res) => {
  const { title, description = '' } = req.body;

  // ── Mock AI Logic ──────────────────────────────────────────────
  // Replace with: const response = await callAIService({ title, description });
  const urgencyKeywords = ['urgent', 'critical', 'blocker', 'asap', 'hotfix', 'production', 'down'];
  const lowKeywords = ['minor', 'nice to have', 'low', 'someday', 'cleanup', 'refactor'];
  const text = `${title} ${description}`.toLowerCase();

  let priority = 'MEDIUM';
  let reason = 'Default priority based on standard task assessment';

  if (urgencyKeywords.some((kw) => text.includes(kw))) {
    priority = 'HIGH';
    reason = 'Task contains urgency indicators (e.g. urgent, blocker, production)';
  } else if (lowKeywords.some((kw) => text.includes(kw))) {
    priority = 'LOW';
    reason = 'Task appears to be non-critical based on description keywords';
  }

  sendSuccess(res, 200, 'Priority suggestion generated', {
    suggestion: { priority, reason, confidence: 0.72 },
    note: 'This is an AI-assisted suggestion. Use your judgment to override.',
  });
});

/**
 * @route   POST /api/projects/:projectId/ai/suggest-assignee
 * @desc    Suggest a team member to assign a task to based on workload
 * @access  Private (project member)
 */
const suggestAssignee = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Count in-progress tasks per member — suggest the least loaded
  const workload = await Task.aggregate([
    { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId), assignee: { $ne: null }, status: { $in: ['TODO', 'IN_PROGRESS'] } } },
    { $group: { _id: '$assignee', activeTasks: { $sum: 1 } } },
    { $sort: { activeTasks: 1 } },
    { $limit: 3 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        user: { _id: 1, name: 1, email: 1, avatar: 1 },
        activeTasks: 1,
        reason: { $literal: 'Has the least active tasks in the project' },
      },
    },
  ]);

  sendSuccess(res, 200, 'Assignee suggestions generated', {
    suggestions: workload,
    note: 'Sorted by current workload (fewest active tasks first)',
  });
});

/**
 * @route   POST /api/projects/:projectId/tasks/:taskId/ai/breakdown
 * @desc    Suggest how to break a task down into subtasks
 * @access  Private (project member)
 */
const suggestTaskBreakdown = asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({
    _id: req.params.taskId,
    project: req.params.projectId,
  });
  if (!task) return next(createError(404, 'Task not found'));

  // ── Mock AI breakdown ──────────────────────────────────────────
  // In production, send task.title + task.description to an LLM
  const mockSubtasks = [
    { title: `Research and plan: ${task.title}`, priority: 'HIGH', estimate: '1-2 hours' },
    { title: `Implement core logic for: ${task.title}`, priority: 'HIGH', estimate: '2-4 hours' },
    { title: `Write tests for: ${task.title}`, priority: 'MEDIUM', estimate: '1-2 hours' },
    { title: `Code review and refinement`, priority: 'MEDIUM', estimate: '30-60 mins' },
    { title: `Documentation and cleanup`, priority: 'LOW', estimate: '30 mins' },
  ];

  sendSuccess(res, 200, 'Task breakdown suggestions generated', {
    originalTask: { id: task._id, title: task.title },
    suggestedSubtasks: mockSubtasks,
    note: 'AI-generated breakdown. Review and adjust estimates before creating tasks.',
  });
});

/**
 * @route   GET /api/projects/:projectId/ai/health-check
 * @desc    Get AI-generated project health insights
 * @access  Private (project member)
 */
const projectHealthCheck = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const [total, done, overdue, highPriority] = await Promise.all([
    Task.countDocuments({ project: projectId }),
    Task.countDocuments({ project: projectId, status: 'DONE' }),
    Task.countDocuments({ project: projectId, dueDate: { $lt: new Date() }, status: { $ne: 'DONE' } }),
    Task.countDocuments({ project: projectId, priority: 'HIGH', status: { $ne: 'DONE' } }),
  ]);

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // Simple rule-based health score (replace with ML model in production)
  let healthScore = 100;
  let insights = [];

  if (overdue > 0) {
    healthScore -= overdue * 5;
    insights.push({ type: 'WARNING', message: `${overdue} task(s) are past their due date` });
  }
  if (highPriority > 3) {
    healthScore -= 10;
    insights.push({ type: 'WARNING', message: `${highPriority} high-priority tasks are unresolved` });
  }
  if (completionRate < 30 && total > 5) {
    healthScore -= 15;
    insights.push({ type: 'INFO', message: `Completion rate is low at ${completionRate}%` });
  }
  if (insights.length === 0) {
    insights.push({ type: 'SUCCESS', message: 'Project is on track — keep it up!' });
  }

  healthScore = Math.max(0, Math.min(100, healthScore));

  sendSuccess(res, 200, 'Project health check complete', {
    healthScore,
    grade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D',
    insights,
    stats: { total, done, overdue, highPriority, completionRate },
  });
});

module.exports = { suggestPriority, suggestAssignee, suggestTaskBreakdown, projectHealthCheck };
