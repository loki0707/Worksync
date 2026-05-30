const Task = require('../models/Task');

/**
 * Generate the next task number for a project.
 * Finds the highest existing taskNumber and increments it.
 * This is safe for low-to-medium concurrency; for high-write systems,
 * replace with a MongoDB counter collection + findOneAndUpdate atomic increment.
 */
const getNextTaskNumber = async (projectId) => {
  const lastTask = await Task.findOne({ project: projectId })
    .sort({ taskNumber: -1 })
    .select('taskNumber')
    .lean();

  return lastTask ? lastTask.taskNumber + 1 : 1;
};

module.exports = { getNextTaskNumber };
