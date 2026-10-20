const express = require('express');
const { body } = require('express-validator');
const {
    getInventory,
    getInventoryByGroup,
    getLowStockAlerts,
    getExpiredDonations,
    updateInventory,
} = require('../controllers/inventoryController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

const updateValidation = [
    body('units_available').isFloat({ min: 0 }).withMessage('Units must be 0 or greater'),
];

// Alerts first (specific routes before :bloodGroup)
router.get('/alerts/low-stock', verifyToken, getLowStockAlerts);
router.get('/alerts/expired', verifyToken, isAdmin, getExpiredDonations);

// General inventory
router.get('/', verifyToken, getInventory);
router.get('/:bloodGroup', verifyToken, getInventoryByGroup);
router.put('/:id', verifyToken, isAdmin, updateValidation, updateInventory);

module.exports = router;