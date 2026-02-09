const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { buyNow } = require("../controllers/buyNowController");

// Buy Now route
router.post("/:id/buy-now", protect, buyNow);

module.exports = router;
