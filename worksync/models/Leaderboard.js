// Cached leaderboard snapshot — rebuilt by cron/on-demand
const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  project:          { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tasksCompleted:   { type: Number, default: 0 },
  reviewsApproved:  { type: Number, default: 0 },
  activityCount:    { type: Number, default: 0 },
  totalScore:       { type: Number, default: 0 },
  avgReviewScore:   { type: Number, default: 0 },
  totalTimeLogged:  { type: Number, default: 0 }, // seconds
  rank:             { type: Number, default: 0 },
  lastUpdated:      { type: Date, default: Date.now },
}, { timestamps: true });

leaderboardSchema.index({ project: 1, totalScore: -1 });
leaderboardSchema.index({ project: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
