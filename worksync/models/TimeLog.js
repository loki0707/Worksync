// Standalone TimeLog collection for cross-task queries
const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  task:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  project:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime:   { type: Date, default: null },
  duration:  { type: Number, default: 0 }, // seconds
  note:      { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

timeLogSchema.index({ task: 1, user: 1 });
timeLogSchema.index({ project: 1, user: 1 });
timeLogSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
