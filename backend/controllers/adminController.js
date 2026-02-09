const User = require("../models/User");
const Auction = require("../models/Auction");

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Block/Unblock user (Admin only)
exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        user.isBlocked = !user.isBlocked;
        await user.save();
        
        res.json({ 
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: { ...user.toObject(), password: undefined }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all auctions (Admin only)
exports.getAllAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find().populate('seller', 'name email');
        res.json(auctions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete auction (Admin only)
exports.deleteAuction = async (req, res) => {
    try {
        const auction = await Auction.findByIdAndDelete(req.params.id);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }
        res.json({ message: "Auction deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get platform statistics (Admin only)
exports.getStatistics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSellers = await User.countDocuments({ isSeller: true });
        const totalBuyers = await User.countDocuments({ isSeller: false });
        const totalAuctions = await Auction.countDocuments();
        const activeAuctions = await Auction.countDocuments({ endTime: { $gt: new Date() } });
        const endedAuctions = await Auction.countDocuments({ endTime: { $lte: new Date() } });
        const paidAuctions = await Auction.countDocuments({ isPaid: true });

        // Calculate total revenue
        const revenueData = await Auction.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: "$currentBid" } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Get recent auctions
        const recentAuctions = await Auction.find()
            .populate('seller', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get top sellers by total bids
        const topSellers = await Auction.aggregate([
            { $match: { bids: { $exists: true, $ne: [] } } },
            { $group: { 
                _id: "$seller",
                totalBids: { $sum: { $size: "$bids" } },
                totalRevenue: { $sum: "$currentBid" },
                auctionCount: { $sum: 1 }
            }},
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);

        // Populate seller info
        await User.populate(topSellers, { path: '_id', select: 'name email' });

        res.json({
            users: {
                total: totalUsers,
                sellers: totalSellers,
                buyers: totalBuyers
            },
            auctions: {
                total: totalAuctions,
                active: activeAuctions,
                ended: endedAuctions,
                paid: paidAuctions
            },
            revenue: {
                total: totalRevenue,
                average: totalAuctions > 0 ? (totalRevenue / totalAuctions).toFixed(2) : 0
            },
            recentAuctions,
            topSellers: topSellers.map(seller => ({
                name: seller._id?.name || 'Unknown',
                email: seller._id?.email,
                totalBids: seller.totalBids,
                totalRevenue: seller.totalRevenue,
                auctionCount: seller.auctionCount
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get payment reports (Admin only)
exports.getPaymentReports = async (req, res) => {
    try {
        const paidAuctions = await Auction.find({ isPaid: true })
            .populate('seller', 'name email')
            .populate('winner', 'name email')
            .sort({ 'paymentDetails.paidAt': -1 });

        const totalRevenue = paidAuctions.reduce((sum, auction) => sum + (auction.paymentDetails?.amount || auction.currentBid), 0);

        res.json({
            totalPayments: paidAuctions.length,
            totalRevenue,
            payments: paidAuctions.map(auction => ({
                auctionId: auction._id,
                title: auction.title,
                seller: auction.seller?.name,
                buyer: auction.winner,
                amount: auction.paymentDetails?.amount || auction.currentBid,
                method: auction.paymentDetails?.method,
                paidAt: auction.paymentDetails?.paidAt,
                transactionId: auction.paymentDetails?.transactionId
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
