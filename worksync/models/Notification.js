const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = system notification
    },
    type: {
      type: String,
      required: true,
      enum: [
        'TASK_ASSIGNED',
        'REVIEW_REQUESTED',
        'REVIEW_APPROVED',
        'REVIEW_CHANGES_REQUESTED',
        'COMMENT_ADDED',
        'MEMBER_ADDED',
        'TASK_DUE_SOON',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Reference to related resource for deep-linking
    link: {
      type: String,
      default: null, // e.g. "/projects/abc123/tasks/456"
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
