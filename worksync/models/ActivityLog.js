const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_DELETED',
        'STATUS_CHANGED',
        'ASSIGNEE_CHANGED',
        'PRIORITY_CHANGED',
        'COMMENT_ADDED',
        'COMMENT_EDITED',
        'COMMENT_DELETED',
        'REVIEW_SUBMITTED',
        'REVIEW_APPROVED',
        'REVIEW_CHANGES_REQUESTED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'PROJECT_CREATED',
        'PROJECT_UPDATED',
        'ATTACHMENT_ADDED',
        'ATTACHMENT_REMOVED',
      ],
    },
    // Metadata: what changed (e.g. { from: 'TODO', to: 'IN_PROGRESS' })
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ task: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
