const db = require('../config/db');
const { validationResult } = require('express-validator');

// Thresholds (project policy)
const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Helper: classify stock level
const classifyStock = (units) => {
    if (units <= CRITICAL_STOCK_THRESHOLD) return 'CRITICAL';
    if (units <= LOW_STOCK_THRESHOLD) return 'LOW';
    return 'NORMAL';
};

// Helper: sweep expired donations and update inventory
// - Marks donations whose expiry_date < today and status='AVAILABLE' as EXPIRED
// - For each expired donation, decrements inventory by units_collected
const sweepExpiredDonations = async (connection) => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Get all expired available donations
    const [expired] = await connection.query(
        `SELECT id, donor_id, blood_group, units_collected
         FROM donations
         WHERE status = 'AVAILABLE' AND expiry_date < ?`,
        [today]
    );

    if (expired.length === 0) {
        return { expiredCount: 0, byGroup: {} };
    }

    // 2. Aggregate units per blood group
    const byGroup = {};
    for (const d of expired) {
        byGroup[d.blood_group] = (byGroup[d.blood_group] || 0) + parseFloat(d.units_collected);
    }

    // 3. Mark each donation as EXPIRED
    const ids = expired.map(d => d.id);
    await connection.query(
        `UPDATE donations SET status = 'EXPIRED' WHERE id IN (?)`,
        [ids]
    );

    // 4. Decrement inventory for each affected group
    for (const group of Object.keys(byGroup)) {
        await connection.query(
            `UPDATE blood_inventory
             SET units_available = GREATEST(units_available - ?, 0)
             WHERE blood_group = ?`,
            [byGroup[group], group]
        );
    }

    return { expiredCount: expired.length, byGroup };
};

// ============ ENDPOINTS ============

// GET /api/inventory
// Returns all blood groups with stock level + summary + expiry stats
exports.getInventory = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await sweepExpiredDonations(connection);
        await connection.commit();

        const [rows] = await connection.query(
            `SELECT id, blood_group, units_available, last_updated
             FROM blood_inventory
             ORDER BY FIELD(blood_group, 'A+','A-','B+','B-','AB+','AB-','O+','O-')`
        );

        const inventory = rows.map(r => ({
            ...r,
            units_available: parseFloat(r.units_available),
            stock_level: classifyStock(parseFloat(r.units_available)),
        }));

        // Summary
        const totalUnits = inventory.reduce((s, r) => s + r.units_available, 0);
        const lowStock = inventory.filter(r => r.stock_level === 'LOW').map(r => r.blood_group);
        const criticalStock = inventory.filter(r => r.stock_level === 'CRITICAL').map(r => r.blood_group);

        // Expiry stats
        const today = new Date().toISOString().split('T')[0];
        const [[expiredRow]] = await connection.query(
            `SELECT COUNT(*) AS cnt, COALESCE(SUM(units_collected),0) AS units
             FROM donations WHERE status = 'EXPIRED'`
        );
        const [[availableRow]] = await connection.query(
            `SELECT COUNT(*) AS cnt, COALESCE(SUM(units_collected),0) AS units
             FROM donations WHERE status = 'AVAILABLE' AND expiry_date >= ?`,
            [today]
        );
        const [[soonRow]] = await connection.query(
            `SELECT COUNT(*) AS cnt, COALESCE(SUM(units_collected),0) AS units
             FROM donations
             WHERE status = 'AVAILABLE'
               AND expiry_date >= ?
               AND expiry_date <= DATE_ADD(?, INTERVAL 7 DAY)`,
            [today, today]
        );

        res.json({
            inventory,
            summary: {
                total_units: totalUnits,
                total_groups: inventory.length,
                low_stock_groups: lowStock,
                critical_stock_groups: criticalStock,
                expired: {
                    donations: expiredRow.cnt,
                    units: parseFloat(expiredRow.units),
                },
                available: {
                    donations: availableRow.cnt,
                    units: parseFloat(availableRow.units),
                },
                expiring_soon: {
                    donations: soonRow.cnt,
                    units: parseFloat(soonRow.units),
                },
            },
        });
    } catch (error) {
        await connection.rollback();
        console.error('getInventory error:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// GET /api/inventory/:bloodGroup
exports.getInventoryByGroup = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { bloodGroup } = req.params;

        if (!BLOOD_GROUPS.includes(bloodGroup)) {
            return res.status(400).json({ message: 'Invalid blood group' });
        }

        await connection.beginTransaction();
        await sweepExpiredDonations(connection);
        await connection.commit();

        const [rows] = await connection.query(
            `SELECT id, blood_group, units_available, last_updated
             FROM blood_inventory WHERE blood_group = ?`,
            [bloodGroup]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Blood group not found in inventory' });
        }

        const item = rows[0];
        item.units_available = parseFloat(item.units_available);
        item.stock_level = classifyStock(item.units_available);

        // Fetch individual donations for this group
        const [donations] = await connection.query(
            `SELECT d.id, d.donor_id, d.units_collected, d.donation_date,
                    d.expiry_date, d.status, u.name AS donor_name
             FROM donations d
             JOIN donors dn ON dn.id = d.donor_id
             JOIN users u ON u.id = dn.user_id
             WHERE d.blood_group = ?
             ORDER BY d.donation_date DESC
             LIMIT 50`,
            [bloodGroup]
        );

        res.json({
            inventory: item,
            donations,
        });
    } catch (error) {
        await connection.rollback();
        console.error('getInventoryByGroup error:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// GET /api/inventory/alerts/low-stock
exports.getLowStockAlerts = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT blood_group, units_available, last_updated
             FROM blood_inventory
             WHERE units_available <= ?
             ORDER BY units_available ASC`,
            [LOW_STOCK_THRESHOLD]
        );

        const alerts = rows.map(r => ({
            blood_group: r.blood_group,
            units_available: parseFloat(r.units_available),
            stock_level: classifyStock(parseFloat(r.units_available)),
        }));

        res.json({ count: alerts.length, alerts });
    } catch (error) {
        console.error('getLowStockAlerts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/inventory/alerts/expired
exports.getExpiredDonations = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await sweepExpiredDonations(connection);
        await connection.commit();

        const [rows] = await connection.query(
            `SELECT d.id, d.donor_id, d.blood_group, d.units_collected,
                    d.donation_date, d.expiry_date, d.status, u.name AS donor_name
             FROM donations d
             JOIN donors dn ON dn.id = d.donor_id
             JOIN users u ON u.id = dn.user_id
             WHERE d.status = 'EXPIRED'
             ORDER BY d.expiry_date DESC
             LIMIT 100`
        );

        const totalUnits = rows.reduce((s, r) => s + parseFloat(r.units_collected), 0);
        res.json({ count: rows.length, total_units: totalUnits, donations: rows });
    } catch (error) {
        await connection.rollback();
        console.error('getExpiredDonations error:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// PUT /api/inventory/:id  (admin manual adjust)
// Body: { units_available, reason }
exports.updateInventory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { units_available, reason } = req.body;

        const [rows] = await db.query(
            'SELECT id, blood_group FROM blood_inventory WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Inventory row not found' });
        }

        await db.query(
            `UPDATE blood_inventory
             SET units_available = ?, last_updated = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [units_available, id]
        );

        const { notifyIfLowStock } = require('../services/inventoryAlerts');
// ... after UPDATE:
notifyIfLowStock(rows[0].blood_group).catch(() => {});

        // Log the manual adjustment as a notification for admins (optional)
        if (reason) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 SELECT id, 'Inventory Adjusted', ?, 'WARNING'
                 FROM users WHERE role = 'ADMIN'`,
                [`${rows[0].blood_group} stock adjusted to ${units_available} units. Reason: ${reason}`]
            );
        }

        res.json({ message: 'Inventory updated successfully' });
    } catch (error) {
        console.error('updateInventory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

