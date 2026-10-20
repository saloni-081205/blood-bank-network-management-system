const db = require('../config/db');
const { validationResult } = require('express-validator');

// Helper: Calculate age from date of birth
const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
};

// Helper: Check eligibility based on rules
// Rules: age >= 18, weight >= 50 kg, last donation >= 90 days ago
const checkEligibility = (donor) => {
    const reasons = [];

    const age = calculateAge(donor.date_of_birth);
    if (age < 18) reasons.push(`Age is ${age}. Must be at least 18.`);
    if (age > 65) reasons.push(`Age is ${age}. Must be 65 or below.`);
    if (parseFloat(donor.weight) < 50) {
        reasons.push(`Weight is ${donor.weight} kg. Must be at least 50 kg.`);
    }

    if (donor.last_donation_date) {
        const last = new Date(donor.last_donation_date);
        const today = new Date();
        const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
        if (diffDays < 90) {
            reasons.push(`Only ${diffDays} days since last donation. Must wait 90 days.`);
        }
    }

    return {
        eligible: reasons.length === 0,
        reasons,
        age,
    };
};

// ============ DONOR ENDPOINTS ============

// GET /api/donors/profile  — get logged-in donor's full profile
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await db.query(
            `SELECT d.id, d.user_id, d.date_of_birth, d.gender, d.blood_group,
                    d.weight, d.address, d.city, d.last_donation_date,
                    d.eligibility_status, d.created_at, d.updated_at,
                    u.name, u.email, u.phone, u.status AS user_status
             FROM donors d
             JOIN users u ON u.id = d.user_id
             WHERE d.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Donor profile not found' });
        }

        res.json({ donor: rows[0] });
    } catch (error) {
        console.error('getMyProfile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/donors/profile  — update logged-in donor's profile
exports.updateMyProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id;
        const {
            name, phone, date_of_birth, gender, blood_group,
            weight, address, city,
        } = req.body;

        // Ensure donor exists
        const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
        if (donors.length === 0) {
            return res.status(404).json({ message: 'Donor profile not found' });
        }
        const donorId = donors[0].id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update users table
            await connection.query(
                'UPDATE users SET name = ?, phone = ? WHERE id = ?',
                [name, phone, userId]
            );

            // Update donors table
            await connection.query(
                `UPDATE donors 
                 SET date_of_birth = ?, gender = ?, blood_group = ?, 
                     weight = ?, address = ?, city = ?
                 WHERE id = ?`,
                [date_of_birth, gender, blood_group, weight, address, city, donorId]
            );

            await connection.commit();
            connection.release();

            // Return updated profile
            const [rows] = await db.query(
                `SELECT d.id, d.user_id, d.date_of_birth, d.gender, d.blood_group,
                        d.weight, d.address, d.city, d.last_donation_date,
                        d.eligibility_status, u.name, u.email, u.phone
                 FROM donors d
                 JOIN users u ON u.id = d.user_id
                 WHERE d.id = ?`,
                [donorId]
            );

            res.json({ message: 'Profile updated successfully', donor: rows[0] });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('updateMyProfile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/donors/:id/eligibility  — check donor eligibility
exports.getEligibility = async (req, res) => {
    try {
        const { id } = req.params;

        // Donor can only check their own; admin can check anyone's
        if (req.user.role === 'DONOR') {
            const [own] = await db.query('SELECT id FROM donors WHERE user_id = ?', [req.user.id]);
            if (own.length === 0 || own[0].id !== parseInt(id)) {
                return res.status(403).json({ message: 'Access denied' });
            }
        } else if (req.user.role !== 'ADMIN' && req.user.role !== 'HOSPITAL') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [rows] = await db.query(
            `SELECT d.*, u.name, u.email 
             FROM donors d 
             JOIN users u ON u.id = d.user_id 
             WHERE d.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        const donor = rows[0];
        const result = checkEligibility(donor);

        // Compute next eligible date if not currently eligible
        let nextEligibleDate = null;
        if (!result.eligible && donor.last_donation_date) {
            const last = new Date(donor.last_donation_date);
            last.setDate(last.getDate() + 90);
            nextEligibleDate = last.toISOString().split('T')[0];
        }

        res.json({
            donor_id: donor.id,
            name: donor.name,
            blood_group: donor.blood_group,
            age: result.age,
            weight: donor.weight,
            last_donation_date: donor.last_donation_date,
            eligible: result.eligible,
            reasons: result.reasons,
            next_eligible_date: nextEligibleDate,
        });
    } catch (error) {
        console.error('getEligibility error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============ ADMIN ENDPOINTS ============

// GET /api/donors  — list all donors with search + filter
exports.getAllDonors = async (req, res) => {
    try {
        const { search = '', blood_group = '', eligibility = '', status = '' } = req.query;

        let sql = `
            SELECT d.id, d.user_id, d.date_of_birth, d.gender, d.blood_group,
                   d.weight, d.address, d.city, d.last_donation_date,
                   d.eligibility_status, d.created_at,
                   u.name, u.email, u.phone, u.status AS user_status
            FROM donors d
            JOIN users u ON u.id = d.user_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        if (blood_group) {
            sql += ' AND d.blood_group = ?';
            params.push(blood_group);
        }

        if (eligibility) {
            sql += ' AND d.eligibility_status = ?';
            params.push(eligibility);
        }

        if (status) {
            sql += ' AND u.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY d.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json({ count: rows.length, donors: rows });
    } catch (error) {
        console.error('getAllDonors error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/donors/:id  — get one donor (admin or self)
exports.getDonorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT d.id, d.user_id, d.date_of_birth, d.gender, d.blood_group,
                    d.weight, d.address, d.city, d.last_donation_date,
                    d.eligibility_status, d.created_at, d.updated_at,
                    u.name, u.email, u.phone, u.status AS user_status
             FROM donors d
             JOIN users u ON u.id = d.user_id
             WHERE d.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        const donor = rows[0];

        // Donor can only view self
        if (req.user.role === 'DONOR' && donor.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ donor });
    } catch (error) {
        console.error('getDonorById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/donors/:id  — admin update any donor
exports.updateDonor = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const {
            name, phone, date_of_birth, gender, blood_group,
            weight, address, city, last_donation_date,
        } = req.body;

        const [donors] = await db.query('SELECT user_id FROM donors WHERE id = ?', [id]);
        if (donors.length === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        const userId = donors[0].user_id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            await connection.query(
                'UPDATE users SET name = ?, phone = ? WHERE id = ?',
                [name, phone, userId]
            );

            await connection.query(
                `UPDATE donors 
                 SET date_of_birth = ?, gender = ?, blood_group = ?, 
                     weight = ?, address = ?, city = ?, last_donation_date = ?
                 WHERE id = ?`,
                [date_of_birth, gender, blood_group, weight, address, city,
                    last_donation_date || null, id]
            );

            await connection.commit();
            connection.release();

            res.json({ message: 'Donor updated successfully' });
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }
    } catch (error) {
        console.error('updateDonor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/donors/:id/deactivate  — admin deactivate donor's user account
exports.deactivateDonor = async (req, res) => {
    try {
        const { id } = req.params;

        const [donors] = await db.query('SELECT user_id FROM donors WHERE id = ?', [id]);
        if (donors.length === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        await db.query(
            'UPDATE users SET status = ? WHERE id = ?',
            ['INACTIVE', donors[0].user_id]
        );

        res.json({ message: 'Donor deactivated successfully' });
    } catch (error) {
        console.error('deactivateDonor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};