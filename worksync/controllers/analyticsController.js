const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const ProjectMember = require('../models/ProjectMember');
const { asyncHandler, sendSuccess } = require('../utils/error');

/**
 * @route   GET /api/projects/:projectId/analytics/overview
 * @desc    Project dashboard overview stats
 * @access  Private (project member)
 */
const getProjectOverview = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const [
    totalTasks,
    tasksByStatus,
    tasksByPriority,
    memberCount,
    recentActivity,
  ] = await Promise.all([
    Task.countDocuments({ project: projectId }),

    Task.aggregate([
      { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Task.aggregate([
      { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),

    ProjectMember.countDocuments({ project: projectId }),

    ActivityLog.find({ project: projectId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  // Normalize status counts into a flat object: { TODO: 5, IN_PROGRESS: 3, ... }
  const statusMap = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
  tasksByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });

  const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  tasksByPriority.forEach(({ _id, count }) => { priorityMap[_id] = count; });

  const completedTasks = statusMap.DONE;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  sendSuccess(res, 200, 'Analytics overview fetched', {
    analytics: {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      tasksByStatus: statusMap,
      tasksByPriority: priorityMap,
      memberCount,
      recentActivity,
    },
  });
});

/**
 * @route   GET /api/projects/:projectId/analytics/productivity
 * @desc    Per-user productivity stats for the project
 * @access  Private (project member)
 */
const getUserProductivity = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const mongoose = require('mongoose');

  const productivity = await Task.aggregate([
    {
      $match: {
        project: mongoose.Types.ObjectId.createFromHexString(projectId),
        assignee: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$assignee',
        totalAssigned: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        inReview: { $sum: { $cond: [{ $eq: ['$status', 'REVIEW'] }, 1, 0] } },
      },
    },
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
        totalAssigned: 1,
        completed: 1,
        inProgress: 1,
        inReview: 1,
        completionRate: {
          $cond: [
            { $eq: ['$totalAssigned', 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ['$completed', '$totalAssigned'] }, 100] }, 1] },
          ],
        },
      },
    },
    { $sort: { completed: -1 } },
  ]);

  sendSuccess(res, 200, 'Productivity stats fetched', { productivity });
});

/**
 * @route   GET /api/projects/:projectId/analytics/velocity
 * @desc    Task completion velocity — tasks completed per day over last 30 days
 * @access  Private (project member)
 */
const getVelocity = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const mongoose = require('mongoose');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count DONE status changes in last 30 days from the activity log
  const velocity = await ActivityLog.aggregate([
    {
      $match: {
        project: mongoose.Types.ObjectId.createFromHexString(projectId),
        action: 'STATUS_CHANGED',
        'meta.to': 'DONE',
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $dateFromParts: { year: '$_id.year', month: '$_id.month', day: '$_id.day' },
        },
        count: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);

  sendSuccess(res, 200, 'Velocity data fetched', { velocity });
});

module.exports = { getProjectOverview, getUserProductivity, getVelocity };
