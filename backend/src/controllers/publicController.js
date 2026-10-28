const db = require('../config/db');

// GET /api/public/stats
// Public — safe aggregate counts only (no user data)
exports.getPublicStats = async (req, res) => {
    try {
        const [[donors]] = await db.query(`SELECT COUNT(*) AS c FROM donors`);
        const [[hospitals]] = await db.query(
            `SELECT COUNT(*) AS c FROM hospitals WHERE status = 'ACTIVE'`
        );
        const [[units]] = await db.query(
            `SELECT COALESCE(SUM(units_available), 0) AS s FROM blood_inventory`
        );
        const [[emergencies]] = await db.query(
            `SELECT COUNT(*) AS c FROM blood_requests
             WHERE request_type = 'EMERGENCY'
               AND status IN ('PENDING','APPROVED','ISSUED')`
        );

        res.json({
            donors: donors.c,
            hospitals: hospitals.c,
            units: parseFloat(units.s),
            emergencies: emergencies.c,
        });
    } catch (error) {
        console.error('getPublicStats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};