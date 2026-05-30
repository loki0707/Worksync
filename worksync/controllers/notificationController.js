const Notification = require('../models/Notification');
const { asyncHandler, sendSuccess } = require('../utils/error');

/**
 * @route   GET /api/notifications
 * @desc    Get current user's notifications (paginated)
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  sendSuccess(res, 200, 'Notifications fetched', {
    notifications,
    unreadCount,
    pagination: { total, page: parseInt(page), limit: parseInt(limit) },
  });
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  sendSuccess(res, 200, 'Notification marked as read');
});

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  sendSuccess(res, 200, 'All notifications marked as read');
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  sendSuccess(res, 200, 'Notification deleted');
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
