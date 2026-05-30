const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Project key cannot exceed 10 characters'],
      // e.g. "WS" for WorkSync — used to prefix task IDs
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'],
      default: 'ACTIVE',
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    githubRepo: {
      type: String,
      default: null, // GitHub repo URL for integration
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: count members (populated separately)
projectSchema.virtual('memberCount', {
  ref: 'ProjectMember',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

// Ensure project key is unique per owner
projectSchema.index({ key: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
