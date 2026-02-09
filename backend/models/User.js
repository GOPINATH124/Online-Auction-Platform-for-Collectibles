const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isSeller: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    phone: { type: String },
    address: { type: String },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    badges: [{
        type: { type: String },
        name: { type: String },
        icon: { type: String },
        earnedAt: { type: Date, default: Date.now }
    }],
    stats: {
        totalBids: { type: Number, default: 0 },
        auctionsWon: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        auctionsSold: { type: Number, default: 0 },
        totalEarned: { type: Number, default: 0 }
    },
    reviews: [{
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewerName: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction' },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Method to check and award badges based on user stats
userSchema.methods.checkAndAwardBadges = async function() {
    const badges = [];
    
    // Verified Seller Badge (10+ auctions sold)
    if (this.stats.auctionsSold >= 10 && !this.badges.some(b => b.type === 'verified-seller')) {
        badges.push({
            type: 'verified-seller',
            name: 'Verified Seller',
            icon: '✅',
            earnedAt: new Date()
        });
    }
    
    // Top Bidder Badge (50+ bids placed)
    if (this.stats.totalBids >= 50 && !this.badges.some(b => b.type === 'top-bidder')) {
        badges.push({
            type: 'top-bidder',
            name: 'Top Bidder',
            icon: '🎯',
            earnedAt: new Date()
        });
    }
    
    // Trusted Buyer Badge (10+ auctions won, 4.5+ rating)
    if (this.stats.auctionsWon >= 10 && this.rating >= 4.5 && !this.badges.some(b => b.type === 'trusted-buyer')) {
        badges.push({
            type: 'trusted-buyer',
            name: 'Trusted Buyer',
            icon: '🤝',
            earnedAt: new Date()
        });
    }
    
    // Power Seller Badge (50+ sales, 4.8+ rating)
    if (this.stats.auctionsSold >= 50 && this.rating >= 4.8 && !this.badges.some(b => b.type === 'power-seller')) {
        badges.push({
            type: 'power-seller',
            name: 'Power Seller',
            icon: '⚡',
            earnedAt: new Date()
        });
    }
    
    // Auction Master Badge (100+ bids, 20+ wins)
    if (this.stats.totalBids >= 100 && this.stats.auctionsWon >= 20 && !this.badges.some(b => b.type === 'auction-master')) {
        badges.push({
            type: 'auction-master',
            name: 'Auction Master',
            icon: '👑',
            earnedAt: new Date()
        });
    }
    
    // Big Spender Badge ($1000+ total spent)
    if (this.stats.totalSpent >= 1000 && !this.badges.some(b => b.type === 'big-spender')) {
        badges.push({
            type: 'big-spender',
            name: 'Big Spender',
            icon: '💎',
            earnedAt: new Date()
        });
    }
    
    // Add new badges to user
    if (badges.length > 0) {
        this.badges.push(...badges);
        await this.save();
    }
    
    return badges;
};

module.exports = mongoose.model("User", userSchema);
