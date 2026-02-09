const express = require("express");
const router = express.Router();
const { placeBid } = require("../controllers/bidController");
const { protect } = require("../middleware/authMiddleware");

// Place a bid on auction - POST /api/bids/:id
router.post("/:id", protect, placeBid);

module.exports = router;
