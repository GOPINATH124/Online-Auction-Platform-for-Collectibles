const express = require("express");
const router = express.Router();

const { addReview, getSellerReviews, getSellerRating } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/add", protect, addReview);
router.get("/seller/:sellerId", getSellerReviews);
router.get("/seller/:sellerId/rating", getSellerRating);

module.exports = router;
