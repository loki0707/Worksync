const path = require('path');
const fs = require('fs');
const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const { asyncHandler, sendSuccess, createError } = require('../utils/error');
const { logActivity } = require('../services/activityService');

/**
 * @route   POST /api/projects/:projectId/tasks/:taskId/attachments
 * @desc    Upload a file attachment to a task
 * @access  Private (project member)
 */
const uploadAttachment = asyncHandler(async (req, res, next) => {
  const { taskId, projectId } = req.params;

  if (!req.file) return next(createError(400, 'No file uploaded'));

  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) return next(createError(404, 'Task not found'));

  // Build accessible URL (relative to server root)
  const fileUrl = `/uploads/${taskId}/${req.file.filename}`;

  const attachment = await Attachment.create({
    task: taskId,
    uploadedBy: req.user._id,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: fileUrl,
    storageType: 'local',
  });

  await attachment.populate('uploadedBy', 'name email avatar');

  logActivity({
    project: projectId,
    task: taskId,
    user: req.user._id,
    action: 'ATTACHMENT_ADDED',
    meta: { fileName: attachment.originalName, size: attachment.size },
  });

  sendSuccess(res, 201, 'File uploaded', { attachment });
});

/**
 * @route   GET /api/projects/:projectId/tasks/:taskId/attachments
 * @desc    Get all attachments for a task
 * @access  Private (project member)
 */
const getAttachments = asyncHandler(async (req, res) => {
  const attachments = await Attachment.find({ task: req.params.taskId })
    .populate('uploadedBy', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  sendSuccess(res, 200, 'Attachments fetched', { attachments });
});

/**
 * @route   DELETE /api/projects/:projectId/tasks/:taskId/attachments/:attachmentId
 * @desc    Delete an attachment (uploader or admin only)
 * @access  Private
 */
const deleteAttachment = asyncHandler(async (req, res, next) => {
  const attachment = await Attachment.findById(req.params.attachmentId);
  if (!attachment) return next(createError(404, 'Attachment not found'));

  const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.membership?.role === 'ADMIN';
  if (!isUploader && !isAdmin) {
    return next(createError(403, 'You cannot delete this attachment'));
  }

  // Remove physical file from disk
  const filePath = path.join(
    process.env.UPLOAD_PATH || './uploads',
    req.params.taskId,
    attachment.fileName
  );
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await attachment.deleteOne();

  logActivity({
    project: req.params.projectId,
    task: req.params.taskId,
    user: req.user._id,
    action: 'ATTACHMENT_REMOVED',
    meta: { fileName: attachment.originalName },
  });

  sendSuccess(res, 200, 'Attachment deleted');
});

module.exports = { uploadAttachment, getAttachments, deleteAttachment };
