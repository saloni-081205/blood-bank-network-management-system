const db = require('../config/db');
const { validationResult } = require('express-validator');
const { notifyIfLowStock } = require('../services/inventoryAlert');

// Blood shelf life in days (per project policy)
const SHELF_LIFE_DAYS = 42;

// Helper: compute expiry date from donation date
const computeExpiryDate = (donationDate) => {
    const d = new Date(donationDate);
    d.setDate(d.getDate() + SHELF_LIFE_DAYS);
    return d.toISOString().split('T')[0];
};

// Helper: recompute donor eligibility after donation
const recomputeEligibility = async (connection, donorId) => {
    const [rows] = await connection.query(
        'SELECT date_of_birth, weight, last_donation_date FROM donors WHERE id = ?',
        [donorId]
    );
    if (rows.length === 0) return 'INELIGIBLE';

    const d = rows[0];
    const birth = new Date(d.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    let eligible = true;
    if (age < 18 || age > 65) eligible = false;
    if (parseFloat(d.weight) < 50) eligible = false;
    if (d.last_donation_date) {
        const last = new Date(d.last_donation_date);
        const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));
        if (diff < 90) eligible = false;
    }

    const status = eligible ? 'ELIGIBLE' : 'INELIGIBLE';
    await connection.query(
        'UPDATE donors SET eligibility_status = ? WHERE id = ?',
        [status, donorId]
    );
    return status;
};

// ============ DONATION ENDPOINTS ============

// POST /api/donations
// Admin or Donor can record a donation.
//   - Donor: creates donation for themselves (donor_id ignored)
//   - Admin: must supply donor_id
exports.createDonation = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { donor_id, blood_group, units_collected, donation_date, notes } = req.body;

        // Donor: resolve their own donor_id
        if (req.user.role === 'DONOR') {
            const [own] = await connection.query(
                'SELECT id, blood_group FROM donors WHERE user_id = ?',
                [req.user.id]
            );
            if (own.length === 0) {
                return res.status(404).json({ message: 'Donor profile not found' });
            }
            donor_id = own[0].id;
            // Force blood_group to match the donor's own blood group
            blood_group = own[0].blood_group;
        } else if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only admins or donors can record donations' });
        }

        if (!donor_id) {
            return res.status(400).json({ message: 'donor_id is required' });
        }

        // Validate donor exists
        const [donorRows] = await connection.query(
            'SELECT id, blood_group, last_donation_date FROM donors WHERE id = ?',
            [donor_id]
        );
        if (donorRows.length === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        const donor = donorRows[0];

        // Enforce blood group match (prevent mismatched records)
        if (donor.blood_group !== blood_group) {
            return res.status(400).json({
                message: `Blood group mismatch. Donor's group is ${donor.blood_group}.`,
            });
        }

        // Prevent duplicate donation on the same day
        if (donor.last_donation_date) {
            const last = new Date(donor.last_donation_date).toISOString().split('T')[0];
            if (last === donation_date) {
                return res.status(400).json({
                    message: 'A donation on this date already exists for this donor.',
                });
            }
        }

        // Enforce 90-day gap (project rule)
        if (donor.last_donation_date) {
            const last = new Date(donor.last_donation_date);
            const current = new Date(donation_date);
            const diff = Math.floor((current - last) / (1000 * 60 * 60 * 24));
            if (diff < 90) {
                return res.status(400).json({
                    message: `Donor is not eligible. Only ${diff} days since last donation (need 90).`,
                });
            }
        }

        const expiry_date = computeExpiryDate(donation_date);

        // ---- TRANSACTION ----
        await connection.beginTransaction();

        try {
            // 1. Insert donation
            const [result] = await connection.query(
                `INSERT INTO donations
                 (donor_id, blood_group, units_collected, donation_date, expiry_date, status, notes)
                 VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
                [donor_id, blood_group, units_collected, donation_date, expiry_date, notes || null]
            );
            const donationId = result.insertId;

            // 2. Update donor.last_donation_date
            await connection.query(
                'UPDATE donors SET last_donation_date = ? WHERE id = ?',
                [donation_date, donor_id]
            );

            // 3. Increment blood_inventory
            await connection.query(
                `UPDATE blood_inventory
                 SET units_available = units_available + ?
                 WHERE blood_group = ?`,
                [units_collected, blood_group]
            );

            // 4. Recompute eligibility
            await recomputeEligibility(connection, donor_id);

            await connection.commit();
            const { notifyIfLowStock } = require('../services/inventoryAlerts');
// ... after commit / connection.release():
notifyIfLowStock(bloodGroup).catch(() => {});
            connection.release();

            // Fetch the newly created donation
            const [newRows] = await db.query(
                `SELECT d.*, u.name AS donor_name
                 FROM donations d
                 JOIN donors dn ON dn.id = d.donor_id
                 JOIN users u ON u.id = dn.user_id
                 WHERE d.id = ?`,
                [donationId]
            );

            res.status(201).json({
                message: 'Donation recorded successfully',
                donation: newRows[0],
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('createDonation error:', error);
        try { connection.release(); } catch (_) {}
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/donations
// - Admin: list all donations (with donor name/group)
// - Donor: list their own donations
exports.getAllDonations = async (req, res) => {
    try {
        const { search = '', blood_group = '', status = '' } = req.query;

        let sql = `
            SELECT d.id, d.donor_id, d.blood_group, d.units_collected,
                   d.donation_date, d.expiry_date, d.status, d.notes,
                   d.created_at, u.name AS donor_name
            FROM donations d
            JOIN donors dn ON dn.id = d.donor_id
            JOIN users u ON u.id = dn.user_id
            WHERE 1=1
        `;
        const params = [];

        // Scope to own donations for donor role
        if (req.user.role === 'DONOR') {
            sql += ' AND dn.user_id = ?';
            params.push(req.user.id);
        } else if (req.user.role !== 'ADMIN' && req.user.role !== 'HOSPITAL') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (search) {
            sql += ' AND (u.name LIKE ? OR d.blood_group LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (blood_group) {
            sql += ' AND d.blood_group = ?';
            params.push(blood_group);
        }
        if (status) {
            sql += ' AND d.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY d.donation_date DESC, d.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json({ count: rows.length, donations: rows });
    } catch (error) {
        console.error('getAllDonations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/donations/:id
exports.getDonationById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT d.*, u.name AS donor_name, u.email AS donor_email,
                    dn.user_id, dn.city AS donor_city
             FROM donations d
             JOIN donors dn ON dn.id = d.donor_id
             JOIN users u ON u.id = dn.user_id
             WHERE d.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        const donation = rows[0];

        // Donor can only view their own
        if (req.user.role === 'DONOR' && donation.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ donation });
    } catch (error) {
        console.error('getDonationById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/donors/:id/donations  — moved here for convenience
exports.getDonationsByDonor = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify donor exists and fetch user_id (for access check)
        const [donorRows] = await db.query(
            'SELECT id, user_id, blood_group FROM donors WHERE id = ?',
            [id]
        );
        if (donorRows.length === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        const donor = donorRows[0];

        // Donor can only view own
        if (req.user.role === 'DONOR' && donor.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        // Hospital is allowed only for a count, not full history — keep it simple and block
        if (req.user.role === 'HOSPITAL') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [rows] = await db.query(
            `SELECT id, donor_id, blood_group, units_collected,
                    donation_date, expiry_date, status, notes, created_at
             FROM donations
             WHERE donor_id = ?
             ORDER BY donation_date DESC`,
            [id]
        );

        res.json({
            donor_id: donor.id,
            blood_group: donor.blood_group,
            count: rows.length,
            donations: rows,
        });
    } catch (error) {
        console.error('getDonationsByDonor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};