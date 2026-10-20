const express = require('express');
const { body } = require('express-validator');
const {
    createDonation,
    getAllDonations,
    getDonationById,
    getDonationsByDonor,
} = require('../controllers/donationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isDonor } = require('../middleware/roleMiddleware');

const router = express.Router();

const donationValidation = [
    body('blood_group')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('units_collected')
        .isFloat({ gt: 0 })
        .withMessage('Units must be greater than 0'),
    body('donation_date')
        .isISO8601()
        .withMessage('Valid donation date required'),
];

// Donation routes
router.post('/', verifyToken, donationValidation, createDonation);
router.get('/', verifyToken, getAllDonations);
router.get('/:id', verifyToken, getDonationById);

module.exports = router;