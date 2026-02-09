const Auction = require("../models/Auction");
const User = require("../models/User");
const emailService = require("../utils/emailService");

// Buy Now - Instant purchase
const buyNow = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const userId = req.user._id.toString();

        console.log('=== BUY NOW REQUEST ===');
        console.log('Auction ID:', auctionId);
        console.log('User ID:', userId);

        const auction = await Auction.findById(auctionId).populate('seller');
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Check if Buy Now is enabled
        if (!auction.buyNowEnabled || !auction.buyNowPrice) {
            return res.status(400).json({ message: "Buy Now is not available for this auction" });
        }

        // Check if auction already ended
        if (new Date() > new Date(auction.endTime)) {
            return res.status(400).json({ message: "This auction has already ended" });
        }

        // Check if already sold
        if (auction.soldViaBuyNow) {
            return res.status(400).json({ message: "This item has already been sold" });
        }

        // Can't buy your own auction
        if (auction.seller._id.toString() === userId) {
            return res.status(400).json({ message: "You cannot buy your own auction" });
        }

        // Get buyer details
        const buyer = await User.findById(userId);

        // Mark auction as sold via Buy Now
        auction.soldViaBuyNow = true;
        auction.buyNowBuyer = userId;
        auction.winner = userId;
        auction.currentBid = auction.buyNowPrice;
        auction.endTime = new Date(); // End the auction immediately
        
        // Add Buy Now as final bid
        auction.bids.push({
            userId: userId,
            bidder: userId,
            amount: auction.buyNowPrice
        });

        await auction.save();

        // Update buyer stats
        buyer.stats.totalBids += 1;
        buyer.stats.auctionsWon += 1;
        buyer.stats.totalSpent += auction.buyNowPrice;
        await buyer.checkAndAwardBadges(); // Award badges if eligible
        await buyer.save();

        // Update seller stats
        const seller = await User.findById(auction.seller._id);
        seller.stats.auctionsSold += 1;
        seller.stats.totalEarned += auction.buyNowPrice;
        await seller.checkAndAwardBadges(); // Award badges if eligible
        await seller.save();

        console.log('✅ Buy Now purchase successful');

        // Send email notifications
        try {
            // Email to buyer
            await emailService.sendEmail(
                buyer.email,
                'Purchase Successful - Buy Now',
                `
                <h2>🎉 Purchase Successful!</h2>
                <p>Hi ${buyer.name},</p>
                <p>You have successfully purchased <strong>${auction.title}</strong> for <strong>$${auction.buyNowPrice}</strong> using Buy Now!</p>
                <p>The seller will contact you shortly for delivery details.</p>
                <p>Please complete the payment within 24 hours to finalize the purchase.</p>
                <p>Transaction ID: ${Date.now()}</p>
                <br>
                <p>Thank you for using our platform!</p>
                `
            );

            // Email to seller
            await emailService.sendEmail(
                auction.seller.email,
                'Item Sold - Buy Now Purchase',
                `
                <h2>🎊 Your Item Has Been Sold!</h2>
                <p>Hi ${auction.seller.name},</p>
                <p>Great news! <strong>${buyer.name}</strong> has purchased your auction <strong>${auction.title}</strong> for <strong>$${auction.buyNowPrice}</strong> using Buy Now!</p>
                <p>Please prepare the item for delivery and contact the buyer.</p>
                <p>Buyer Email: ${buyer.email}</p>
                <br>
                <p>Congratulations on your sale!</p>
                `
            );
        } catch (emailError) {
            console.error('Email notification error:', emailError.message);
        }

        res.status(200).json({
            message: "Purchase successful! You won the auction via Buy Now!",
            auction: auction,
            price: auction.buyNowPrice
        });

    } catch (err) {
        console.error('Buy Now error:', err);
        res.status(500).json({ message: "Error processing Buy Now purchase", error: err.message });
    }
};

module.exports = {
    buyNow
};
