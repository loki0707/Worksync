const { asyncHandler, sendSuccess } = require('../utils/error');
const { getProjectActivity } = require('../services/activityService');
const { getPagination } = require('../utils/pagination');

/**
 * @route   GET /api/projects/:projectId/activity
 * @desc    Get activity log for a project
 * @access  Private (project member)
 */
const getActivity = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { taskId, userId } = req.query;
  const { limit, skip, page } = getPagination(req.query);

  const { logs, total } = await getProjectActivity(projectId, { taskId, userId, limit, skip });

  sendSuccess(res, 200, 'Activity fetched', {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

module.exports = { getActivity };
