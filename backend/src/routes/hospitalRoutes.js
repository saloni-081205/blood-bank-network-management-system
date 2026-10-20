const express = require('express');
const { body } = require('express-validator');
const {
    getMyProfile,
    updateMyProfile,
    getAllHospitals,
    getHospitalById,
    updateHospitalStatus,
    getCities,
} = require('../controllers/hospitalController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isHospital } = require('../middleware/roleMiddleware');

const router = express.Router();

const profileValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('hospital_name').notEmpty().withMessage('Hospital name is required'),
    body('contact_number').notEmpty().withMessage('Contact number is required'),
];

// Self routes (hospital only)
router.get('/profile', verifyToken, isHospital, getMyProfile);
router.put('/profile', verifyToken, isHospital, profileValidation, updateMyProfile);

// Admin list + meta
router.get('/', verifyToken, isAdmin, getAllHospitals);
router.get('/cities', verifyToken, isAdmin, getCities);

// Detail (admin any, hospital self)
router.get('/:id', verifyToken, getHospitalById);

// Admin status update (verify / deactivate / reset to pending)
router.put('/:id/status', verifyToken, isAdmin, updateHospitalStatus);

module.exports = router;