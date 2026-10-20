const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Register User
exports.register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            name, email, password, phone, role,
            // Donor specific
            date_of_birth, gender, blood_group, weight, address, city,
            // Hospital specific
            hospital_name, license_number, contact_number
        } = req.body;

        // Check if user already exists
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ 
                message: 'User already exists with this email' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert user
            const [userResult] = await connection.query(
                `INSERT INTO users (name, email, password, phone, role, status) 
                 VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
                [name, email, hashedPassword, phone, role]
            );

            const userId = userResult.insertId;

            // If DONOR, insert into donors table
            if (role === 'DONOR') {
                await connection.query(
                    `INSERT INTO donors 
                     (user_id, date_of_birth, gender, blood_group, weight, address, city) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [userId, date_of_birth, gender, blood_group, weight, address, city]
                );
            }

            // If HOSPITAL, insert into hospitals table
            if (role === 'HOSPITAL') {
                await connection.query(
                    `INSERT INTO hospitals 
                     (user_id, hospital_name, license_number, contact_number, address, city) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, hospital_name, license_number, contact_number, address, city]
                );
            }

            await connection.commit();
            connection.release();

            // Generate JWT token
            const token = jwt.sign(
                { id: userId, email, role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'Registration successful',
                token,
                user: {
                    id: userId,
                    name,
                    email,
                    role
                }
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Get user with password
        const [users] = await db.query(
            'SELECT id, name, email, password, role, status FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];

    // Hospital registration creates a hospital record.
    // The hospital must be verified by an admin before login.

        if (user.role === 'HOSPITAL') {
            const [hosp] = await db.query(
                'SELECT status FROM hospitals WHERE user_id = ?',
                [user.id]
            );

            if (hosp.length > 0 && hosp[0].status === 'PENDING') {
                return res.status(403).json({
                    message: 'Your hospital account is pending admin verification.'
                });
            }
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Account is inactive' });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Get Current User
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.query(
            'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        let additionalData = null;

        // Get role-specific data
        if (user.role === 'DONOR') {
            const [donors] = await db.query(
                'SELECT * FROM donors WHERE user_id = ?',
                [userId]
            );
            if (donors.length > 0) {
                additionalData = donors[0];
            }
        } else if (user.role === 'HOSPITAL') {
            const [hospitals] = await db.query(
                'SELECT * FROM hospitals WHERE user_id = ?',
                [userId]
            );
            if (hospitals.length > 0) {
                additionalData = hospitals[0];
            }
        }

        res.json({
            user,
            additionalData
        });

    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};