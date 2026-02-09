const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getUserBadges, getUserBiddingStats } = require("../controllers/badgeController");

// Get user badges
router.get("/badges/:userId", protect, getUserBadges);
router.get("/badges", protect, getUserBadges);

// Get user bidding stats and history
router.get("/bidding-stats", protect, getUserBiddingStats);

module.exports = router;
