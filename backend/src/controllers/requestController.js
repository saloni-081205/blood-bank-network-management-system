const db = require('../config/db');
const { validationResult } = require('express-validator');

const VALID_TRANSITIONS = {
    PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: ['ISSUED', 'REJECTED', 'CANCELLED'],
    ISSUED: ['COMPLETED'],
    REJECTED: [],
    COMPLETED: [],
    CANCELLED: [],
};

// ============ HOSPITAL ENDPOINTS ============

// POST /api/requests  — create request (HOSPITAL)
exports.createRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { blood_group, units_requested, request_type, urgency, reason } = req.body;

        // Normalize request_type
        request_type = request_type === 'EMERGENCY' ? 'EMERGENCY' : 'NORMAL';

        // Emergency always CRITICAL urgency unless explicitly downgraded
        if (request_type === 'EMERGENCY') {
            urgency = urgency || 'CRITICAL';
        } else {
            urgency = urgency || 'MEDIUM';
        }

        // Resolve hospital
        const [hospitals] = await db.query(
            'SELECT id, hospital_name, status FROM hospitals WHERE user_id = ?',
            [req.user.id]
        );
        if (hospitals.length === 0) {
            return res.status(404).json({ message: 'Hospital profile not found' });
        }
        if (hospitals[0].status !== 'ACTIVE') {
            return res.status(403).json({
                message: 'Your hospital account is not active. Contact admin.',
            });
        }
        const hospitalId = hospitals[0].id;
        const hospitalName = hospitals[0].hospital_name;

        // Insert
        const [result] = await db.query(
            `INSERT INTO blood_requests
             (hospital_id, blood_group, units_requested, request_type, urgency, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
            [hospitalId, blood_group, units_requested, request_type, urgency, reason || null]
        );
        const requestId = result.insertId;

        // Notify admins — louder for emergency
        const [admins] = await db.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
        const title = request_type === 'EMERGENCY'
            ? `🚨 EMERGENCY: ${blood_group} needed (${units_requested} units)`
            : `New Blood Request: ${blood_group}`;
        const message = request_type === 'EMERGENCY'
            ? `${hospitalName} urgently needs ${units_requested} units of ${blood_group}. Immediate review required.`
            : `${hospitalName} requested ${units_requested} units of ${blood_group}.`;
        const notifType = request_type === 'EMERGENCY' ? 'ERROR' : 'INFO';

        for (const a of admins) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [a.id, title, message, notifType]
            );
        }

        const [rows] = await db.query(
            `SELECT r.*, h.hospital_name, h.city, h.contact_number
             FROM blood_requests r
             JOIN hospitals h ON h.id = r.hospital_id
             WHERE r.id = ?`,
            [requestId]
        );

        res.status(201).json({
            message: request_type === 'EMERGENCY'
                ? 'Emergency request created. Admins have been notified.'
                : 'Request created successfully',
            request: rows[0],
        });
    } catch (error) {
        console.error('createRequest error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/requests  — list
//   HOSPITAL: own requests only
//   ADMIN: all requests
exports.getAllRequests = async (req, res) => {
    try {
        const { search = '', status = '', blood_group = '', request_type = '' } = req.query;

        let sql = `
            SELECT r.id, r.hospital_id, r.blood_group, r.units_requested,
                   r.request_type, r.urgency, r.reason, r.status,
                   r.requested_at, r.approved_at, r.completed_at,
                   h.hospital_name, h.city, h.contact_number
            FROM blood_requests r
            JOIN hospitals h ON h.id = r.hospital_id
            WHERE 1=1
        `;
        const params = [];

        // Scope for hospitals
        if (req.user.role === 'HOSPITAL') {
            const [hospitals] = await db.query(
                'SELECT id FROM hospitals WHERE user_id = ?',
                [req.user.id]
            );
            if (hospitals.length === 0) {
                return res.json({ count: 0, requests: [] });
            }
            sql += ' AND r.hospital_id = ?';
            params.push(hospitals[0].id);
        } else if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (search) {
            sql += ' AND h.hospital_name LIKE ?';
            params.push(`%${search}%`);
        }
        if (status) {
            sql += ' AND r.status = ?';
            params.push(status);
        }
        if (blood_group) {
            sql += ' AND r.blood_group = ?';
            params.push(blood_group);
        }
        if (request_type) {
            sql += ' AND r.request_type = ?';
            params.push(request_type);
        }

        // Emergency first, then newest
        sql += ` ORDER BY 
                 CASE r.request_type WHEN 'EMERGENCY' THEN 0 ELSE 1 END,
                 r.requested_at DESC`;

        const [rows] = await db.query(sql, params);
        res.json({ count: rows.length, requests: rows });
    } catch (error) {
        console.error('getAllRequests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/requests/:id
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT r.*, h.hospital_name, h.city, h.contact_number, h.address,
                    h.user_id AS hospital_user_id
             FROM blood_requests r
             JOIN hospitals h ON h.id = r.hospital_id
             WHERE r.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = rows[0];

        // Hospitals can only view their own
        if (req.user.role === 'HOSPITAL' && request.hospital_user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Current inventory of requested group
        const [inv] = await db.query(
            'SELECT units_available FROM blood_inventory WHERE blood_group = ?',
            [request.blood_group]
        );

        res.json({
            request,
            inventory: inv.length > 0
                ? { blood_group: request.blood_group, units_available: parseFloat(inv[0].units_available) }
                : null,
        });
    } catch (error) {
        console.error('getRequestById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============ ADMIN WORKFLOW ENDPOINTS ============

// PUT /api/requests/:id/approve  — PENDING/REJECTED → APPROVED
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT id, status, blood_group, units_requested, hospital_id FROM blood_requests WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = rows[0];
        if (!VALID_TRANSITIONS[request.status].includes('APPROVED')) {
            return res.status(400).json({
                message: `Cannot approve a request with status ${request.status}`,
            });
        }

        // Check inventory availability (soft check — just warn on issue step)
        const [inv] = await db.query(
            'SELECT units_available FROM blood_inventory WHERE blood_group = ?',
            [request.blood_group]
        );
        const available = inv.length > 0 ? parseFloat(inv[0].units_available) : 0;

        await db.query(
            'UPDATE blood_requests SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['APPROVED', id]
        );

        // Notify hospital
        const [hospitalRows] = await db.query(
            'SELECT user_id FROM hospitals WHERE id = ?',
            [request.hospital_id]
        );
        if (hospitalRows.length > 0) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [
                    hospitalRows[0].user_id,
                    'Blood Request Approved',
                    `Your request for ${request.units_requested} units of ${request.blood_group} has been approved.`,
                    'SUCCESS',
                ]
            );
        }

        res.json({
            message: 'Request approved',
            inventory_available: available,
        });
    } catch (error) {
        console.error('approveRequest error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/requests/:id/reject
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const [rows] = await db.query(
            'SELECT id, status, hospital_id, blood_group, units_requested FROM blood_requests WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = rows[0];
        if (!VALID_TRANSITIONS[request.status].includes('REJECTED')) {
            return res.status(400).json({
                message: `Cannot reject a request with status ${request.status}`,
            });
        }

        await db.query(
            'UPDATE blood_requests SET status = ?, reason = CONCAT(COALESCE(reason, ""), ?) WHERE id = ?',
            ['REJECTED', reason ? `\n[Rejection] ${reason}` : '', id]
        );

        const [hospitalRows] = await db.query(
            'SELECT user_id FROM hospitals WHERE id = ?',
            [request.hospital_id]
        );
        if (hospitalRows.length > 0) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [
                    hospitalRows[0].user_id,
                    'Blood Request Rejected',
                    `Your request for ${request.units_requested} units of ${request.blood_group} was rejected.${reason ? ' Reason: ' + reason : ''}`,
                    'ERROR',
                ]
            );
        }

        res.json({ message: 'Request rejected' });
    } catch (error) {
        console.error('rejectRequest error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/requests/:id/issue
// Critical: atomically decrement inventory. Rolls back if insufficient.
exports.issueRequest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // Lock the row for update
        const [rows] = await connection.query(
            'SELECT id, status, hospital_id, blood_group, units_requested FROM blood_requests WHERE id = ? FOR UPDATE',
            [id]
        );
        if (rows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = rows[0];
        if (!VALID_TRANSITIONS[request.status].includes('ISSUED')) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                message: `Cannot issue a request with status ${request.status}`,
            });
        }

        // Lock inventory row
        const [inv] = await connection.query(
            'SELECT id, units_available FROM blood_inventory WHERE blood_group = ? FOR UPDATE',
            [request.blood_group]
        );
        if (inv.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: 'Blood group not in inventory' });
        }

        const available = parseFloat(inv[0].units_available);
        const requested = parseFloat(request.units_requested);

        if (available < requested) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                message: `Insufficient stock. Available: ${available}, requested: ${requested}.`,
            });
        }

        // Decrement inventory
        await connection.query(
            `UPDATE blood_inventory
             SET units_available = units_available - ?
             WHERE id = ?`,
            [requested, inv[0].id]
        );

        // Mark request as ISSUED
        await connection.query(
            `UPDATE blood_requests
             SET status = 'ISSUED', approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP)
             WHERE id = ?`,
            [id]
        );

        // Also mark equivalent donations as USED (FIFO — soonest expiry first)
        // This keeps donations and inventory in sync.
        let remaining = requested;
        const [donations] = await connection.query(
            `SELECT id, units_collected FROM donations
             WHERE blood_group = ? AND status = 'AVAILABLE'
             ORDER BY expiry_date ASC
             FOR UPDATE`,
            [request.blood_group]
        );
        for (const d of donations) {
            if (remaining <= 0) break;
            const units = parseFloat(d.units_collected);
            if (units <= remaining) {
                await connection.query(
                    "UPDATE donations SET status = 'USED' WHERE id = ?",
                    [d.id]
                );
                remaining -= units;
            }
            // Partial usage is not modeled here; donations are whole units in this project.
        }

        await connection.commit();
        connection.release();

        const { notifyIfLowStock } = require('../services/inventoryAlerts');
// ...
notifyIfLowStock(request.blood_group).catch(() => {});

        // Notify hospital
        const [hospitalRows] = await db.query(
            'SELECT user_id FROM hospitals WHERE id = ?',
            [request.hospital_id]
        );
        if (hospitalRows.length > 0) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [
                    hospitalRows[0].user_id,
                    'Blood Issued',
                    `${request.units_requested} units of ${request.blood_group} have been issued.`,
                    'SUCCESS',
                ]
            );
        }

        res.json({
            message: 'Blood issued successfully',
            units_issued: requested,
            remaining_stock: available - requested,
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('issueRequest error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/requests/:id/complete
exports.completeRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT id, status, hospital_id, blood_group, units_requested FROM blood_requests WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = rows[0];
        if (!VALID_TRANSITIONS[request.status].includes('COMPLETED')) {
            return res.status(400).json({
                message: `Cannot complete a request with status ${request.status}`,
            });
        }

        await db.query(
            'UPDATE blood_requests SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['COMPLETED', id]
        );

        const [hospitalRows] = await db.query(
            'SELECT user_id FROM hospitals WHERE id = ?',
            [request.hospital_id]
        );
        if (hospitalRows.length > 0) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [
                    hospitalRows[0].user_id,
                    'Request Completed',
                    `Your request for ${request.units_requested} units of ${request.blood_group} is now complete.`,
                    'SUCCESS',
                ]
            );
        }

        res.json({ message: 'Request completed' });
    } catch (error) {
        console.error('completeRequest error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/requests/emergency
// Returns currently active emergency requests (status not completed/rejected/cancelled)
// Sorted by urgency then age. Admins only.
exports.getEmergencyQueue = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.id, r.hospital_id, r.blood_group, r.units_requested,
                    r.request_type, r.urgency, r.reason, r.status,
                    r.requested_at, r.approved_at,
                    h.hospital_name, h.city, h.contact_number,
                    TIMESTAMPDIFF(MINUTE, r.requested_at, NOW()) AS minutes_open
             FROM blood_requests r
             JOIN hospitals h ON h.id = r.hospital_id
             WHERE r.request_type = 'EMERGENCY'
               AND r.status IN ('PENDING', 'APPROVED', 'ISSUED')
             ORDER BY
               FIELD(r.status, 'PENDING', 'APPROVED', 'ISSUED'),
               FIELD(r.urgency, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'),
               r.requested_at ASC`
        );

        // Attach current stock for each row
        const groups = [...new Set(rows.map(r => r.blood_group))];
        let stockMap = {};
        if (groups.length > 0) {
            const [inv] = await db.query(
                `SELECT blood_group, units_available FROM blood_inventory
                 WHERE blood_group IN (?)`,
                [groups]
            );
            inv.forEach(i => { stockMap[i.blood_group] = parseFloat(i.units_available); });
        }

        const queue = rows.map(r => ({
            ...r,
            units_available: stockMap[r.blood_group] ?? 0,
            stock_sufficient: (stockMap[r.blood_group] ?? 0) >= parseFloat(r.units_requested),
        }));

        res.json({
            count: queue.length,
            pending: queue.filter(q => q.status === 'PENDING').length,
            queue,
        });
    } catch (error) {
        console.error('getEmergencyQueue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};