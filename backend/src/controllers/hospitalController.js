const db = require('../config/db');
const { validationResult } = require('express-validator');

// ============ HOSPITAL SELF ENDPOINTS ============

// GET /api/hospitals/profile
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT h.id, h.user_id, h.hospital_name, h.license_number,
                    h.address, h.city, h.contact_number, h.status,
                    h.created_at, h.updated_at,
                    u.name, u.email, u.phone, u.status AS user_status
             FROM hospitals h
             JOIN users u ON u.id = h.user_id
             WHERE h.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Hospital profile not found' });
        }

        res.json({ hospital: rows[0] });
    } catch (error) {
        console.error('getMyHospitalProfile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/hospitals/profile
exports.updateMyProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id;
        const {
            name, phone, hospital_name, address, city, contact_number,
        } = req.body;

        const [hospitals] = await db.query(
            'SELECT id FROM hospitals WHERE user_id = ?',
            [userId]
        );
        if (hospitals.length === 0) {
            return res.status(404).json({ message: 'Hospital profile not found' });
        }
        const hospitalId = hospitals[0].id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                'UPDATE users SET name = ?, phone = ? WHERE id = ?',
                [name, phone, userId]
            );

            await connection.query(
                `UPDATE hospitals
                 SET hospital_name = ?, address = ?, city = ?, contact_number = ?
                 WHERE id = ?`,
                [hospital_name, address, city, contact_number, hospitalId]
            );

            await connection.commit();
            connection.release();

            const [rows] = await db.query(
                `SELECT h.*, u.name, u.email, u.phone
                 FROM hospitals h
                 JOIN users u ON u.id = h.user_id
                 WHERE h.id = ?`,
                [hospitalId]
            );

            res.json({ message: 'Profile updated successfully', hospital: rows[0] });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('updateMyHospitalProfile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============ ADMIN ENDPOINTS ============

// GET /api/hospitals  (admin only)
// Query: search, city, status
exports.getAllHospitals = async (req, res) => {
    try {
        const { search = '', city = '', status = '' } = req.query;

        let sql = `
            SELECT h.id, h.user_id, h.hospital_name, h.license_number,
                   h.address, h.city, h.contact_number, h.status,
                   h.created_at,
                   u.name, u.email, u.phone, u.status AS user_status
            FROM hospitals h
            JOIN users u ON u.id = h.user_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ' AND (h.hospital_name LIKE ? OR u.email LIKE ? OR h.license_number LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (city) {
            sql += ' AND h.city = ?';
            params.push(city);
        }
        if (status) {
            sql += ' AND h.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY h.created_at DESC';

        const [rows] = await db.query(sql, params);

        // Summary counts
        const summary = {
            total: rows.length,
            pending: rows.filter(r => r.status === 'PENDING').length,
            active: rows.filter(r => r.status === 'ACTIVE').length,
            inactive: rows.filter(r => r.status === 'INACTIVE').length,
        };

        res.json({ summary, count: rows.length, hospitals: rows });
    } catch (error) {
        console.error('getAllHospitals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/hospitals/:id  (admin any, hospital self only)
exports.getHospitalById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT h.id, h.user_id, h.hospital_name, h.license_number,
                    h.address, h.city, h.contact_number, h.status,
                    h.created_at, h.updated_at,
                    u.name, u.email, u.phone, u.status AS user_status
             FROM hospitals h
             JOIN users u ON u.id = h.user_id
             WHERE h.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        const hospital = rows[0];

        // Hospital can only view itself
        if (req.user.role === 'HOSPITAL' && hospital.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Aggregate simple stats for admin detail view
        let stats = null;
        if (req.user.role === 'ADMIN') {
            const [[requests]] = await db.query(
                `SELECT COUNT(*) AS total FROM blood_requests WHERE hospital_id = ?`,
                [id]
            );
            stats = { requests };
        }

        res.json({ hospital, stats });
    } catch (error) {
        console.error('getHospitalById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/hospitals/:id/status  (admin only)
// Body: { status: 'ACTIVE' | 'INACTIVE' | 'PENDING' }
exports.updateHospitalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowed = ['ACTIVE', 'INACTIVE', 'PENDING'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [rows] = await db.query(
            'SELECT user_id FROM hospitals WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Hospital not found' });
        }
        const userId = rows[0].user_id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update hospital status
            await connection.query(
                'UPDATE hospitals SET status = ? WHERE id = ?',
                [status, id]
            );

            // Sync user account status: ACTIVE hospital → ACTIVE user; else INACTIVE
            const userStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
            await connection.query(
                'UPDATE users SET status = ? WHERE id = ?',
                [userStatus, userId]
            );

            // Notify hospital
            const title = status === 'ACTIVE'
                ? 'Hospital Account Approved'
                : status === 'INACTIVE'
                    ? 'Hospital Account Deactivated'
                    : 'Hospital Account Pending Review';
            const message = status === 'ACTIVE'
                ? 'Your hospital account has been verified. You can now log in and request blood.'
                : status === 'INACTIVE'
                    ? 'Your hospital account has been deactivated. Contact the administrator.'
                    : 'Your hospital account is pending review.';

            await connection.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [userId, title, message, status === 'ACTIVE' ? 'SUCCESS' : 'WARNING']
            );

            await connection.commit();
            connection.release();

            res.json({ message: `Hospital ${status.toLowerCase()} successfully` });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('updateHospitalStatus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/hospitals/cities  (admin only) — distinct city list for filter dropdown
exports.getCities = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT DISTINCT city FROM hospitals
             WHERE city IS NOT NULL AND city <> ''
             ORDER BY city ASC`
        );
        res.json({ cities: rows.map(r => r.city) });
    } catch (error) {
        console.error('getCities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};