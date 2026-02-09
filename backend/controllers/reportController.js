const Auction = require("../models/Auction");
const User = require("../models/User");

// Report/Flag an auction
const reportAuction = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const { reason, description } = req.body;
        const userId = req.user._id.toString();

        if (!reason) {
            return res.status(400).json({ message: "Please provide a reason for reporting" });
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Check if user already reported this auction
        const alreadyReported = auction.flagReports.some(report => report.userId === userId);
        if (alreadyReported) {
            return res.status(400).json({ message: "You have already reported this auction" });
        }

        // Add report
        auction.flagReports.push({
            userId: userId,
            reason: reason,
            description: description || "",
            reportedAt: new Date()
        });

        // Flag auction if it has 3 or more reports
        if (auction.flagReports.length >= 3) {
            auction.isFlagged = true;
        }

        await auction.save();

        res.status(200).json({ 
            message: "Auction reported successfully",
            totalReports: auction.flagReports.length,
            isFlagged: auction.isFlagged
        });
    } catch (err) {
        console.error('Report auction error:', err);
        res.status(500).json({ message: "Error reporting auction", error: err.message });
    }
};

// Get reports for an auction (admin only)
const getAuctionReports = async (req, res) => {
    try {
        const auctionId = req.params.id;

        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        res.status(200).json({
            reports: auction.flagReports,
            totalReports: auction.flagReports.length,
            isFlagged: auction.isFlagged
        });
    } catch (err) {
        console.error('Get reports error:', err);
        res.status(500).json({ message: "Error retrieving reports" });
    }
};

module.exports = {
    reportAuction,
    getAuctionReports
};
