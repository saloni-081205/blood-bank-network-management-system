const express = require('express');
const {
    getAdminDashboard,
    getDonorDashboard,
    getHospitalDashboard,
} = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isDonor, isHospital } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/admin', verifyToken, isAdmin, getAdminDashboard);
router.get('/donor', verifyToken, isDonor, getDonorDashboard);
router.get('/hospital', verifyToken, isHospital, getHospitalDashboard);

module.exports = router;