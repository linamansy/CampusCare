const prisma = require('../prismaClient');
const { parsePositiveInt } = require('../utils/issueHelpers');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount: notifications.filter((item) => !item.isRead).length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
  }
};

exports.markNotificationRead = async (req, res) => {
  const notificationId = parsePositiveInt(req.params.id);

  if (!notificationId) {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: req.userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};
