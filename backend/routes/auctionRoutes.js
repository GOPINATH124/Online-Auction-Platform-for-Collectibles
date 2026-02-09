const express = require("express");
const router = express.Router();

const { createAuction, getAuctions, getAuctionById, payAuction, updateAuction, deleteAuction } = require("../controllers/auctionController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// create auction (seller only) - POST /api/auctions
router.post("/", protect, upload.array('images', 5), createAuction);

// get all auctions - GET /api/auctions
router.get("/", getAuctions);

// get single auction - GET /api/auctions/:id
router.get("/:id", getAuctionById);

// update auction (seller only) - PUT /api/auctions/:id
router.put("/:id", protect, upload.array('images', 5), updateAuction);

// delete auction (seller only) - DELETE /api/auctions/:id
router.delete("/:id", protect, deleteAuction);

// pay for auction - POST /api/auctions/:id/pay
router.post("/:id/pay", protect, payAuction);

module.exports = router;
