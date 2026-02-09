const User = require("../models/User");

// Add review for a seller
exports.addReview = async (req, res) => {
    try {
        const { sellerId, rating, comment, auctionId } = req.body;
        const reviewerId = req.user._id;
        const reviewerName = req.user.name;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const seller = await User.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        // Check if user already reviewed this auction
        const existingReview = seller.reviews.find(
            r => r.reviewer?.toString() === reviewerId.toString() && r.auctionId?.toString() === auctionId
        );

        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this seller for this auction" });
        }

        // Add review
        seller.reviews.push({
            reviewer: reviewerId,
            reviewerName,
            rating,
            comment,
            auctionId,
            createdAt: new Date()
        });

        // Update average rating
        const totalRating = seller.reviews.reduce((sum, review) => sum + review.rating, 0);
        seller.rating = totalRating / seller.reviews.length;
        seller.totalReviews = seller.reviews.length;

        await seller.save();

        res.json({ 
            message: "Review added successfully", 
            rating: seller.rating,
            totalReviews: seller.totalReviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get reviews for a seller
exports.getSellerReviews = async (req, res) => {
    try {
        const seller = await User.findById(req.params.sellerId).select('reviews rating totalReviews name');
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        res.json({
            sellerName: seller.name,
            rating: seller.rating || 0,
            totalReviews: seller.totalReviews || 0,
            reviews: seller.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get seller's rating
exports.getSellerRating = async (req, res) => {
    try {
        const seller = await User.findById(req.params.sellerId).select('rating totalReviews');
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        res.json({
            rating: seller.rating || 0,
            totalReviews: seller.totalReviews || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
