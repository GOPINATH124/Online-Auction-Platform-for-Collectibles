const Auction = require("../models/Auction");
const User = require("../models/User");

// Helper function to execute auto-bids after a manual bid
async function executeAutoBids(auction) {
    console.log(`\n=== AUTO-BID EXECUTION START ===`);
    console.log(`Current bid: $${auction.currentBid}`);
    console.log(`Active auto-bids: ${auction.autoBids.filter(ab => ab.isActive).length}`);
    
    let bidPlaced = true;
    let iterations = 0;
    const MAX_ITERATIONS = 50; // Prevent infinite loops

    while (bidPlaced && iterations < MAX_ITERATIONS) {
        bidPlaced = false;
        iterations++;

        // Get all active auto-bids sorted by max amount (highest first)
        const activeAutoBids = auction.autoBids
            .filter(ab => ab.isActive && ab.maxAmount > auction.currentBid)
            .sort((a, b) => b.maxAmount - a.maxAmount);

        console.log(`Iteration ${iterations}: Found ${activeAutoBids.length} auto-bids above current bid`);
        
        if (activeAutoBids.length === 0) break;

        // Get the highest auto-bid
        const highestAutoBid = activeAutoBids[0];
        console.log(`Highest auto-bid: ${highestAutoBid.bidderName} with max $${highestAutoBid.maxAmount}`);
        
        // Calculate next bid amount (increment by $1)
        let nextBid = auction.currentBid + 1;

        // If there's a second-highest auto-bid, bid just above it
        if (activeAutoBids.length > 1) {
            const secondHighest = activeAutoBids[1];
            nextBid = Math.min(
                secondHighest.maxAmount + 1,
                highestAutoBid.maxAmount
            );
        }

        // Make sure we don't exceed the max amount
        if (nextBid > highestAutoBid.maxAmount) {
            nextBid = highestAutoBid.maxAmount;
        }

        console.log(`Next auto-bid will be: $${nextBid}`);

        // Place the auto-bid
        if (nextBid > auction.currentBid && nextBid <= highestAutoBid.maxAmount) {
            auction.currentBid = nextBid;
            auction.winner = highestAutoBid.userId;
            
            auction.bids.push({
                userId: highestAutoBid.userId,
                bidder: highestAutoBid.userId,
                amount: nextBid,
                isAutoBid: true
            });

            // Update proxy bid
            const autoBidIndex = auction.autoBids.findIndex(
                ab => ab.userId === highestAutoBid.userId && ab.isActive
            );
            if (autoBidIndex !== -1) {
                auction.autoBids[autoBidIndex].currentProxyBid = nextBid;
            }

            console.log(`✅ Auto-bid placed: ${highestAutoBid.bidderName} bid $${nextBid}`);
            bidPlaced = true;
        }
    }

    if (bidPlaced) {
        await auction.save();
        console.log(`=== AUTO-BID EXECUTION END: ${iterations} bids placed ===\n`);
    } else {
        console.log(`=== AUTO-BID EXECUTION END: No bids placed ===\n`);
    }
}

// Set auto-bid (proxy bid) for an auction
const setAutoBid = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const { maxAmount } = req.body;
        const userId = req.user._id.toString();

        const maxBid = parseFloat(maxAmount);
        if (isNaN(maxBid) || maxBid <= 0) {
            return res.status(400).json({ message: "Invalid maximum bid amount" });
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Check if auction has ended
        if (new Date() > new Date(auction.endTime)) {
            return res.status(400).json({ message: "Auction has ended" });
        }

        // Max bid must be higher than current bid
        if (maxBid <= auction.currentBid) {
            return res.status(400).json({ 
                message: `Maximum bid must be higher than current bid of $${auction.currentBid}` 
            });
        }

        // Check if user already has an active auto-bid
        const existingAutoBidIndex = auction.autoBids.findIndex(
            ab => ab.userId === userId && ab.isActive
        );

        if (existingAutoBidIndex !== -1) {
            // Update existing auto-bid
            auction.autoBids[existingAutoBidIndex].maxAmount = maxBid;
            auction.autoBids[existingAutoBidIndex].currentProxyBid = Math.min(maxBid, auction.currentBid + 1);
        } else {
            // Create new auto-bid
            auction.autoBids.push({
                userId: userId,
                bidderName: req.user.name,
                maxAmount: maxBid,
                currentProxyBid: auction.currentBid + 1,
                isActive: true
            });
        }

        await auction.save();

        // Try to execute auto-bid immediately
        await executeAutoBids(auction);

        res.status(200).json({ 
            message: "Auto-bid set successfully",
            maxAmount: maxBid,
            currentBid: auction.currentBid
        });
    } catch (err) {
        console.error('Set auto-bid error:', err);
        res.status(500).json({ message: "Error setting auto-bid", error: err.message });
    }
};

// Get user's auto-bid for an auction
const getAutoBid = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const userId = req.user._id.toString();

        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const autoBid = auction.autoBids.find(ab => ab.userId === userId && ab.isActive);

        res.status(200).json({ 
            hasAutoBid: !!autoBid,
            autoBid: autoBid || null
        });
    } catch (err) {
        console.error('Get auto-bid error:', err);
        res.status(500).json({ message: "Error retrieving auto-bid" });
    }
};

// Cancel auto-bid
const cancelAutoBid = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const userId = req.user._id.toString();

        const auction = await Auction.findById(auctionId);
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        const autoBidIndex = auction.autoBids.findIndex(
            ab => ab.userId === userId && ab.isActive
        );

        if (autoBidIndex === -1) {
            return res.status(404).json({ message: "No active auto-bid found" });
        }

        auction.autoBids[autoBidIndex].isActive = false;
        await auction.save();

        res.status(200).json({ message: "Auto-bid cancelled successfully" });
    } catch (err) {
        console.error('Cancel auto-bid error:', err);
        res.status(500).json({ message: "Error cancelling auto-bid" });
    }
};

// Export all functions
module.exports = {
    setAutoBid,
    getAutoBid,
    cancelAutoBid,
    executeAutoBids
};

