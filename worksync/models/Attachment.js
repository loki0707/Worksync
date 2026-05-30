const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true, // Stored filename (possibly renamed)
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number, // bytes
      required: true,
    },
    // URL to access the file (local path or cloud URL)
    url: {
      type: String,
      required: true,
    },
    // Storage backend: 'local', 's3', 'gcs' — extendable for cloud migration
    storageType: {
      type: String,
      enum: ['local', 's3', 'gcs'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
);

attachmentSchema.index({ task: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
