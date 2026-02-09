const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

// Create payment intent
router.post("/:auctionId/create-payment-intent", protect, paymentController.createPaymentIntent);

// Confirm payment
router.post("/:auctionId/confirm-payment", protect, paymentController.confirmPayment);

// Get payment status
router.get("/:auctionId/payment-status", protect, paymentController.getPaymentStatus);

// Process refund (admin only)
router.post("/:auctionId/refund", protect, paymentController.processRefund);

module.exports = router;
