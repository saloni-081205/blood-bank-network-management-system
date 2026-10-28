const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { phoneValidator, optionalPhoneValidator } = require('../utils/validators');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    phoneValidator('phone'),
    body('role').isIn(['DONOR', 'HOSPITAL']).withMessage('Invalid role'),
    // Hospital-only fields (validated only when role === HOSPITAL)
    optionalPhoneValidator('contact_number'),
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', verifyToken, getMe);

module.exports = router;