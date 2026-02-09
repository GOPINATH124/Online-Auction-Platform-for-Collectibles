const express = require("express");
const router = express.Router();
const { reportAuction, getAuctionReports } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

// Report an auction
router.post("/:id", protect, reportAuction);

// Get auction reports (admin)
router.get("/:id", protect, getAuctionReports);

module.exports = router;
