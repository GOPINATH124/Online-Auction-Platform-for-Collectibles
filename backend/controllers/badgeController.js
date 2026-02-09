const User = require("../models/User");
const Auction = require("../models/Auction");

// Award badges based on user stats
async function checkAndAwardBadges(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    const existingBadgeTypes = user.badges.map(b => b.type);

    // 🏆 Verified Seller Badge (10+ successful sales)
    if (user.isSeller && user.stats.auctionsSold >= 10 && !existingBadgeTypes.includes('verified_seller')) {
        user.badges.push({
            type: 'verified_seller',
            name: 'Verified Seller',
            icon: '✅',
            earnedAt: new Date()
        });
    }

    // 🔥 Top Bidder Badge (50+ total bids)
    if (user.stats.totalBids >= 50 && !existingBadgeTypes.includes('top_bidder')) {
        user.badges.push({
            type: 'top_bidder',
            name: 'Top Bidder',
            icon: '🔥',
            earnedAt: new Date()
        });
    }

    // 💎 Trusted Buyer Badge (10+ auctions won with 4.5+ rating)
    if (user.stats.auctionsWon >= 10 && user.rating >= 4.5 && !existingBadgeTypes.includes('trusted_buyer')) {
        user.badges.push({
            type: 'trusted_buyer',
            name: 'Trusted Buyer',
            icon: '💎',
            earnedAt: new Date()
        });
    }

    // 🌟 Power Seller Badge (50+ sales and 4.8+ rating)
    if (user.isSeller && user.stats.auctionsSold >= 50 && user.rating >= 4.8 && !existingBadgeTypes.includes('power_seller')) {
        user.badges.push({
            type: 'power_seller',
            name: 'Power Seller',
            icon: '🌟',
            earnedAt: new Date()
        });
    }

    // 🎯 Auction Master Badge (100+ total bids and 20+ wins)
    if (user.stats.totalBids >= 100 && user.stats.auctionsWon >= 20 && !existingBadgeTypes.includes('auction_master')) {
        user.badges.push({
            type: 'auction_master',
            name: 'Auction Master',
            icon: '🎯',
            earnedAt: new Date()
        });
    }

    // 💰 Big Spender Badge (spent over $1000)
    if (user.stats.totalSpent >= 1000 && !existingBadgeTypes.includes('big_spender')) {
        user.badges.push({
            type: 'big_spender',
            name: 'Big Spender',
            icon: '💰',
            earnedAt: new Date()
        });
    }

    await user.save();
    return user.badges;
}

// Add method to User model
User.schema.methods.checkAndAwardBadges = async function() {
    return await checkAndAwardBadges(this._id);
};

// Get user badges
const getUserBadges = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;
        const user = await User.findById(userId).select('badges stats rating');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            badges: user.badges,
            stats: user.stats,
            rating: user.rating
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching badges", error: err.message });
    }
};

// Get user bidding history and stats
const getUserBiddingStats = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // Get all auctions where user placed bids
        const auctions = await Auction.find({
            'bids.userId': userId
        }).sort({ createdAt: -1 });

        // Calculate stats
        const totalBids = auctions.reduce((sum, auction) => {
            return sum + auction.bids.filter(bid => bid.userId === userId).length;
        }, 0);

        const auctionsWon = auctions.filter(auction => auction.winner === userId).length;
        
        const totalSpent = auctions
            .filter(auction => auction.winner === userId && auction.isPaid)
            .reduce((sum, auction) => sum + auction.currentBid, 0);

        // Group by category
        const categoryBids = {};
        auctions.forEach(auction => {
            const category = auction.category || 'Other';
            categoryBids[category] = (categoryBids[category] || 0) + 1;
        });

        const favoriteCategory = Object.keys(categoryBids).reduce((a, b) => 
            categoryBids[a] > categoryBids[b] ? a : b, 'None'
        );

        // Win rate
        const winRate = auctions.length > 0 ? ((auctionsWon / auctions.length) * 100).toFixed(1) : 0;

        // Get user's current bids (active auctions)
        const activeBids = auctions.filter(auction => {
            return new Date(auction.endTime) > new Date() && !auction.soldViaBuyNow;
        });

        // Get bid history details
        const bidHistory = auctions.map(auction => {
            const userBids = auction.bids.filter(bid => bid.userId === userId);
            const highestUserBid = Math.max(...userBids.map(b => b.amount));
            const isWinner = auction.winner === userId;
            const isActive = new Date(auction.endTime) > new Date();

            return {
                auctionId: auction._id,
                title: auction.title,
                category: auction.category,
                highestBid: highestUserBid,
                currentBid: auction.currentBid,
                totalBids: userBids.length,
                isWinner: isWinner,
                isActive: isActive,
                isPaid: auction.isPaid,
                endTime: auction.endTime,
                image: auction.images && auction.images.length > 0 ? auction.images[0].url : null
            };
        });

        res.status(200).json({
            stats: {
                totalBids,
                auctionsWon,
                totalSpent,
                winRate: parseFloat(winRate),
                favoriteCategory,
                activeBids: activeBids.length
            },
            bidHistory: bidHistory
        });

    } catch (err) {
        console.error('Error fetching bidding stats:', err);
        res.status(500).json({ message: "Error fetching bidding stats", error: err.message });
    }
};

module.exports = {
    getUserBadges,
    getUserBiddingStats,
    checkAndAwardBadges
};
