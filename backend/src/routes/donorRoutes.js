const express = require('express');
const { body } = require('express-validator');
const {
    getMyProfile, updateMyProfile, getEligibility,
    getAllDonors, getDonorById, updateDonor, deactivateDonor,
} = require('../controllers/donorController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isDonor } = require('../middleware/roleMiddleware');
const { getDonationsByDonor } = require('../controllers/donationController');

const router = express.Router();

// Validation rules
const profileValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('date_of_birth').isISO8601().withMessage('Valid date of birth required'),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender'),
    body('blood_group')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('weight').isFloat({ min: 0 }).withMessage('Weight must be positive'),
];

// ---- Donor self routes ----
router.get('/profile', verifyToken, isDonor, getMyProfile);
router.put('/profile', verifyToken, isDonor, profileValidation, updateMyProfile);

// ---- Admin only ----
router.get('/', verifyToken, isAdmin, getAllDonors);

// ---- Shared: admin or self (checked inside controller) ----
router.get('/:id', verifyToken, getDonorById);
router.put('/:id', verifyToken, isAdmin, profileValidation, updateDonor);
router.put('/:id/deactivate', verifyToken, isAdmin, deactivateDonor);
router.get('/:id/eligibility', verifyToken, getEligibility);

router.get('/:id/donations', verifyToken, getDonationsByDonor);

module.exports = router;