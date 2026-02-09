const express = require("express");
const router = express.Router();
const { setAutoBid, getAutoBid, cancelAutoBid } = require("../controllers/autoBidController");
const { protect } = require("../middleware/authMiddleware");

// Set auto-bid
router.post("/:id", protect, setAutoBid);

// Get auto-bid
router.get("/:id", protect, getAutoBid);

// Cancel auto-bid
router.delete("/:id", protect, cancelAutoBid);

module.exports = router;
