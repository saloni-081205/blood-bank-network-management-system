const db = require('../config/db');

// GET /api/notifications
//   Returns user's notifications + unread count.
//   Query: unread_only=true|false, limit (default 50)
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { unread_only = 'false', limit = 50 } = req.query;
        const lim = Math.min(parseInt(limit) || 50, 200);

        let sql = `
            SELECT id, title, message, type, is_read, created_at
            FROM notifications
            WHERE user_id = ?
        `;
        const params = [userId];

        if (unread_only === 'true') sql += ' AND is_read = FALSE';
        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(lim);

        const [rows] = await db.query(sql, params);

        const [[{ unread }]] = await db.query(
            `SELECT COUNT(*) AS unread FROM notifications
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        res.json({
            unread_count: unread,
            count: rows.length,
            notifications: rows,
        });
    } catch (error) {
        console.error('getMyNotifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/notifications/unread-count
//   Lightweight polling endpoint for the bell badge.
exports.getUnreadCount = async (req, res) => {
    try {
        const [[{ unread }]] = await db.query(
            `SELECT COUNT(*) AS unread FROM notifications
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );
        res.json({ unread_count: unread });
    } catch (error) {
        console.error('getUnreadCount error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT user_id FROM notifications WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        if (rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [id]
        );

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/notifications  (internal utility — admin only)
//   Used if you want to send a custom notification from the admin panel later.
exports.createNotification = async (req, res) => {
    try {
        const { user_id, title, message, type } = req.body;
        if (!user_id || !title || !message) {
            return res.status(400).json({ message: 'user_id, title, and message are required' });
        }
        const allowed = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
        const t = allowed.includes(type) ? type : 'INFO';

        await db.query(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES (?, ?, ?, ?)`,
            [user_id, title, message, t]
        );

        res.status(201).json({ message: 'Notification created' });
    } catch (error) {
        console.error('createNotification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};