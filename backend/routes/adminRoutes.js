const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// User management
router.get('/users', protect, isAdmin, adminController.getAllUsers);
router.delete('/users/:id', protect, isAdmin, adminController.deleteUser);
router.put('/users/:id/toggle-status', protect, isAdmin, adminController.toggleUserStatus);

// Auction management
router.get('/auctions', protect, isAdmin, adminController.getAllAuctions);
router.delete('/auctions/:id', protect, isAdmin, adminController.deleteAuction);

// Statistics and reports
router.get('/statistics', protect, isAdmin, adminController.getStatistics);
router.get('/payments', protect, isAdmin, adminController.getPaymentReports);

module.exports = router;
