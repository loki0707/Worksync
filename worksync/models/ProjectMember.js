const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      // ADMIN: full control, DEVELOPER: creates/submits tasks, REVIEWER: reviews tasks
      enum: ['ADMIN', 'DEVELOPER', 'REVIEWER'],
      default: 'DEVELOPER',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });
projectMemberSchema.index({ project: 1, role: 1 });

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
