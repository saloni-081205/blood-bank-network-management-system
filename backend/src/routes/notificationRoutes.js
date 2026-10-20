const express = require('express');
const {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', verifyToken, getMyNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.put('/read-all', verifyToken, markAllAsRead);
router.put('/:id/read', verifyToken, markAsRead);
router.post('/', verifyToken, isAdmin, createNotification);

module.exports = router;