const mongoose = require('mongoose');

// Per-reviewer score sub-schema
const reviewerSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:        { type: String, enum: ['PENDING','APPROVED','CHANGES_REQUESTED'], default: 'PENDING' },
  codeQuality:   { type: Number, min: 1, max: 5, default: null },
  readability:   { type: Number, min: 1, max: 5, default: null },
  avgScore:      { type: Number, default: null },
  comment:       { type: String, default: '' },
  reviewedAt:    { type: Date, default: null },
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  task:            { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  submittedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Multi-reviewer support
  reviewers:       [reviewerSchema],
  // Minimum approvals required before task can be marked DONE
  minApprovals:    { type: Number, default: 1 },
  status:          { type: String, enum: ['PENDING','APPROVED','CHANGES_REQUESTED'], default: 'PENDING' },
  githubPR:        { type: String, default: null },
  // Overall averaged score across all reviewers
  overallScore:    { type: Number, default: null },
  history: [{
    reviewer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action:    { type: String, enum: ['SUBMITTED','APPROVED','CHANGES_REQUESTED'] },
    comment:   { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

reviewSchema.index({ task: 1 });

module.exports = mongoose.model('Review', reviewSchema);
