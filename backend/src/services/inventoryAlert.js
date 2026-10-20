const db = require('../config/db');

const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

// Insert a low-stock notification for all admins
// De-duplicates: does not create the same alert twice within 12 hours.
async function notifyIfLowStock(bloodGroup) {
    try {
        const [inv] = await db.query(
            'SELECT units_available FROM blood_inventory WHERE blood_group = ?',
            [bloodGroup]
        );
        if (inv.length === 0) return;
        const units = parseFloat(inv[0].units_available);

        let level = null;
        if (units <= CRITICAL_STOCK_THRESHOLD) level = 'CRITICAL';
        else if (units <= LOW_STOCK_THRESHOLD) level = 'LOW';
        if (!level) return;

        // De-dupe
        const [recent] = await db.query(
            `SELECT id FROM notifications
             WHERE title LIKE ? AND created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
             LIMIT 1`,
            [`%${bloodGroup}%stock%`]
        );
        if (recent.length > 0) return;

        const [admins] = await db.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
        const title = level === 'CRITICAL'
            ? `🚨 ${bloodGroup} stock is CRITICAL`
            : `⚠ ${bloodGroup} stock is low`;
        const message = `${bloodGroup} inventory is at ${units} units. Threshold: ${level === 'CRITICAL' ? CRITICAL_STOCK_THRESHOLD : LOW_STOCK_THRESHOLD}.`;

        for (const a of admins) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [a.id, title, message, level === 'CRITICAL' ? 'ERROR' : 'WARNING']
            );
        }
    } catch (err) {
        console.error('notifyIfLowStock error:', err);
    }
}

module.exports = { notifyIfLowStock };