const Task = require('../models/Task');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');
const TimeLog = require('../models/TimeLog');
const ProjectMember = require('../models/ProjectMember');
const { asyncHandler, sendSuccess } = require('../utils/error');
const mongoose = require('mongoose');

/**
 * @route GET /api/projects/:projectId/leaderboard
 * @desc  Compute and return productivity leaderboard for a project
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const pid = mongoose.Types.ObjectId.createFromHexString(projectId);

  // Get all members
  const members = await ProjectMember.find({ project: projectId })
    .populate('user', 'name email avatar')
    .lean();

  const memberIds = members.map(m => m.user._id);

  // Tasks completed per user
  const completedAgg = await Task.aggregate([
    { $match: { project: pid, status: 'DONE', isDeleted: false, assignee: { $in: memberIds } } },
    { $group: { _id: '$assignee', count: { $sum: 1 } } },
  ]);

  // Reviews approved per user
  const reviewsAgg = await Review.aggregate([
    { $unwind: '$reviewers' },
    { $match: { 'reviewers.user': { $in: memberIds }, 'reviewers.status': 'APPROVED' } },
    { $group: { _id: '$reviewers.user', count: { $sum: 1 }, avgScore: { $avg: '$reviewers.avgScore' } } },
  ]);

  // Activity count per user
  const activityAgg = await ActivityLog.aggregate([
    { $match: { project: pid, user: { $in: memberIds } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);

  // Time logged per user
  const timeAgg = await TimeLog.aggregate([
    { $match: { project: pid, user: { $in: memberIds }, isActive: false } },
    { $group: { _id: '$user', totalSeconds: { $sum: '$duration' } } },
  ]);

  // Build lookup maps
  const completedMap = Object.fromEntries(completedAgg.map(a => [a._id.toString(), a.count]));
  const reviewsMap   = Object.fromEntries(reviewsAgg.map(a => [a._id.toString(), { count: a.count, avgScore: a.avgScore }]));
  const activityMap  = Object.fromEntries(activityAgg.map(a => [a._id.toString(), a.count]));
  const timeMap      = Object.fromEntries(timeAgg.map(a => [a._id.toString(), a.totalSeconds]));

  // Score formula: completed*10 + reviewsApproved*5 + activity*1
  const ranked = members.map(m => {
    const uid = m.user._id.toString();
    const tasksCompleted  = completedMap[uid]  || 0;
    const reviewsApproved = reviewsMap[uid]?.count || 0;
    const activityCount   = activityMap[uid]   || 0;
    const totalTimeLogged = timeMap[uid]        || 0;
    const avgReviewScore  = reviewsMap[uid]?.avgScore || 0;
    const totalScore      = tasksCompleted * 10 + reviewsApproved * 5 + activityCount;

    return { user: m.user, role: m.role, tasksCompleted, reviewsApproved, activityCount, totalTimeLogged, avgReviewScore, totalScore };
  }).sort((a, b) => b.totalScore - a.totalScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  sendSuccess(res, 200, 'Leaderboard fetched', { leaderboard: ranked });
});

module.exports = { getLeaderboard };
