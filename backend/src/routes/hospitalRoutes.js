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
const { phoneValidator, optionalPhoneValidator } = require('../utils/validators');

const router = express.Router();

const profileValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    phoneValidator('phone'),
    body('hospital_name').trim().notEmpty().withMessage('Hospital name is required'),
    optionalPhoneValidator('contact_number'),
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