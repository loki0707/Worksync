const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const timeLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime:   { type: Date, default: null },
  duration:  { type: Number, default: 0 },
  note:      { type: String, default: '' },
}, { _id: true });

const versionSchema = new mongoose.Schema({
  version:   { type: Number, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
  snapshot: {
    title: String, description: String, status: String,
    priority: String, assignee: mongoose.Schema.Types.ObjectId,
    dueDate: Date, labels: [String],
  },
  changeNote: { type: String, default: '' },
}, { _id: true });

const recurrenceSchema = new mongoose.Schema({
  enabled:    { type: Boolean, default: false },
  frequency:  { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  dayOfWeek:  { type: Number, default: 1 },
  dayOfMonth: { type: Number, default: 1 },
  lastRun:    { type: Date, default: null },
  nextRun:    { type: Date, default: null },
  endDate:    { type: Date, default: null },
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 300 },
  description: { type: String, default: '' },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  taskNumber:  { type: Number, required: true },
  status:      { type: String, enum: ['TODO','IN_PROGRESS','REVIEW','DONE'], default: 'TODO' },
  priority:    { type: String, enum: ['LOW','MEDIUM','HIGH'], default: 'MEDIUM' },
  assignee:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporter:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate:     { type: Date, default: null },
  githubPR:    { type: String, default: null },
  labels:      [{ type: String, trim: true }],
  dependencies:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  isDeleted:   { type: Boolean, default: false, index: true },
  deletedAt:   { type: Date, default: null },
  deletedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  alertSent:   { type: Boolean, default: false },
  isPinned:    { type: Boolean, default: false, index: true },
  currentVersion: { type: Number, default: 1 },
  versions:    [versionSchema],
  timeLogs:    [timeLogSchema],
  totalTime:   { type: Number, default: 0 },
  recurrence:  { type: recurrenceSchema, default: () => ({}) },
  statusHistory: [{
    from: String, to: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

taskSchema.virtual('commentsCount',    { ref: 'Comment',    localField: '_id', foreignField: 'task', count: true });
taskSchema.virtual('attachmentsCount', { ref: 'Attachment', localField: '_id', foreignField: 'task', count: true });
taskSchema.index({ project: 1, status: 1, isDeleted: 1 });
taskSchema.index({ project: 1, taskNumber: 1 }, { unique: true });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ dueDate: 1, alertSent: 1 });
taskSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Task', taskSchema);
