const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', verifyAuth, notificationController.getMyNotifications);
router.put('/:id/read', verifyAuth, notificationController.markNotificationRead);
router.put('/read-all', verifyAuth, notificationController.markAllNotificationsRead);

module.exports = router;
