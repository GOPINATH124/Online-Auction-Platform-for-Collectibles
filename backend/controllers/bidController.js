const Auction = require("../models/Auction");
const User = require("../models/User");
const emailService = require("../utils/emailService");

// Place a bid
exports.placeBid = async (req, res) => {
    try {
        console.log('=== PLACE BID REQUEST ===');
        console.log('Auction ID:', req.params.id);
        console.log('User:', req.user);
        console.log('Bid amount:', req.body.amount);
        
        const auctionId = req.params.id;
        const { amount } = req.body;

        // Validate amount
        const bidAmount = parseFloat(amount);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            console.log('ERROR: Invalid bid amount');
            return res.status(400).json({ message: "Invalid bid amount" });
        }

        // Set maximum bid limit (100 billion)
        if (bidAmount > 100000000000) {
            console.log('ERROR: Bid too large');
            return res.status(400).json({ message: "Bid amount too large. Maximum is $100,000,000,000" });
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) {
            console.log('ERROR: Auction not found');
            return res.status(404).json({ message: "Auction not found" });
        }

        console.log('Current bid:', auction.currentBid);
        console.log('New bid:', bidAmount);

        // Check bid is higher than currentBid
        if (bidAmount <= auction.currentBid) {
            console.log('ERROR: Bid not higher than current bid');
            return res.status(400).json({ message: "Bid must be higher than current bid" });
        }

        // Get seller and bidder info
        const seller = await User.findById(auction.seller);
        const bidder = req.user;

        // Notify previous highest bidder that they've been outbid
        if (auction.winner && auction.winner !== req.user._id.toString()) {
            const previousBidder = await User.findById(auction.winner);
            if (previousBidder && previousBidder.email) {
                emailService.sendOutbidNotification(
                    previousBidder.email,
                    previousBidder.name,
                    auction.title,
                    auction.currentBid,
                    bidAmount
                );
            }
        }

        // Notify seller about new bid
        if (seller && seller.email) {
            emailService.sendNewBidNotification(
                seller.email,
                seller.name,
                auction.title,
                bidAmount,
                bidder.name
            );
        }

        // Add bid
        auction.bids.push({
            userId: req.user._id.toString(),
            bidder: req.user._id.toString(),
            amount: bidAmount,
            createdAt: new Date()
        });

        // Update currentBid and set winner as highest bidder
        auction.currentBid = bidAmount;
        auction.winner = req.user._id.toString();

        await auction.save();

        // Update bidder stats
        bidder.stats.totalBids += 1;
        await bidder.checkAndAwardBadges(); // Check and award badges
        await bidder.save();

        // Execute auto-bids after manual bid (lazy load to avoid circular dependency)
        try {
            const { executeAutoBids } = require("./autoBidController");
            const updatedAuction = await Auction.findById(auctionId);
            await executeAutoBids(updatedAuction);
            // Reload auction to get updated currentBid after auto-bids
            const finalAuction = await Auction.findById(auctionId);
            auction = finalAuction;
        } catch (err) {
            console.log('Auto-bid execution skipped:', err.message);
        }

        console.log('SUCCESS: Bid placed successfully');

        // Emit real-time Socket.io event
        const io = req.app.get('io');
        if (io) {
            io.to(`auction-${auctionId}`).emit('new-bid', {
                auctionId,
                amount: auction.currentBid,
                bidderName: bidder.name,
                totalBids: auction.bids.length,
                currentBid: auction.currentBid
            });
        }

        res.json({ message: "Bid placed successfully", auction });

    } catch (error) {
        console.error('ERROR placing bid:', error);
        res.status(500).json({ error: error.message });
    }
};
