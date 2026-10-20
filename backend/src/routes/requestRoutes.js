const express = require('express');
const { body } = require('express-validator');
const {
    createRequest,
    getAllRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    issueRequest,
    completeRequest,
    getEmergencyQueue,
} = require('../controllers/requestController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isHospital } = require('../middleware/roleMiddleware');

const router = express.Router();

const createValidation = [
    body('blood_group')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
    body('units_requested').isFloat({ gt: 0 }).withMessage('Units must be greater than 0'),
    body('request_type').optional().isIn(['NORMAL', 'EMERGENCY']).withMessage('Invalid request type'),
    body('urgency').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid urgency'),
];

// Creation + listing
router.post('/', verifyToken, isHospital, createValidation, createRequest);
router.get('/', verifyToken, getAllRequests);

// Emergency priority queue (admin) — MUST be before /:id
router.get('/emergency', verifyToken, isAdmin, getEmergencyQueue);

// Detail
router.get('/:id', verifyToken, getRequestById);

// Admin workflow actions (same for normal & emergency)
router.put('/:id/approve', verifyToken, isAdmin, approveRequest);
router.put('/:id/reject', verifyToken, isAdmin, rejectRequest);
router.put('/:id/issue', verifyToken, isAdmin, issueRequest);
router.put('/:id/complete', verifyToken, isAdmin, completeRequest);

module.exports = router;