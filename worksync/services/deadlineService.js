/**
 * Deadline Alert Service
 * Run this on an interval (e.g. every hour via setInterval or a cron job)
 * Finds tasks due within 24 hours that haven't been alerted yet and sends notifications.
 */
const Task = require('../models/Task');
const { createNotification } = require('./notificationService');

const checkDeadlines = async (io) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: in24h },
      status: { $nin: ['DONE'] },
      isDeleted: false,
      alertSent: false,
      assignee: { $ne: null },
    }).populate('assignee', 'name').lean();

    for (const task of tasks) {
      await createNotification(io, {
        recipient: task.assignee._id,
        type: 'TASK_DUE_SOON',
        title: 'Task Due Soon',
        message: `"${task.title}" is due within 24 hours`,
        link: `/projects/${task.project}/tasks/${task._id}`,
      });

      // Mark alert sent
      await Task.updateOne({ _id: task._id }, { alertSent: true });
    }

    if (tasks.length) console.log(`⏰ Sent ${tasks.length} deadline alert(s)`);
  } catch (err) {
    console.error('❌ Deadline check error:', err.message);
  }
};

/**
 * Recurring Task Service
 * Creates new task instances for recurring tasks whose nextRun <= now
 */
const { getNextTaskNumber } = require('./taskNumberService');

const processRecurringTasks = async () => {
  try {
    const now = new Date();
    const tasks = await Task.find({
      'recurrence.enabled': true,
      'recurrence.nextRun': { $lte: now },
      isDeleted: false,
      $or: [
        { 'recurrence.endDate': null },
        { 'recurrence.endDate': { $gte: now } },
      ],
    }).lean();

    for (const task of tasks) {
      const taskNumber = await getNextTaskNumber(task.project.toString());

      // Clone the task
      const newTask = new (require('../models/Task'))({
        title:       task.title,
        description: task.description,
        project:     task.project,
        taskNumber,
        status:      'TODO',
        priority:    task.priority,
        assignee:    task.assignee,
        reporter:    task.reporter,
        labels:      task.labels,
        recurrence:  { enabled: false }, // clones don't recur themselves
      });
      await newTask.save();

      // Advance nextRun on parent
      const rec = task.recurrence;
      let nextRun = new Date(now);
      if (rec.frequency === 'daily')        nextRun.setDate(nextRun.getDate() + 1);
      else if (rec.frequency === 'weekly')  nextRun.setDate(nextRun.getDate() + 7);
      else if (rec.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);

      await Task.updateOne({ _id: task._id }, {
        'recurrence.lastRun': now,
        'recurrence.nextRun': nextRun,
      });

      console.log(`🔁 Created recurring task #${taskNumber} from parent #${task.taskNumber}`);
    }
  } catch (err) {
    console.error('❌ Recurring task error:', err.message);
  }
};

module.exports = { checkDeadlines, processRecurringTasks };
