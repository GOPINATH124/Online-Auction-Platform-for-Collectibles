const Auction = require("../models/Auction");
const User = require("../models/User");

// Initialize Stripe (will be initialized when env is loaded)
let stripe = null;
let stripeEnabled = false;

try {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  // Only initialize Stripe if a valid key is provided
  if (stripeKey && stripeKey !== 'sk_test_demo_key_not_required' && stripeKey.startsWith('sk_')) {
    stripe = require('stripe')(stripeKey);
    stripeEnabled = true;
    console.log('✅ Stripe payment enabled');
  } else {
    console.log('⚠️ Stripe not configured - Using direct payment only');
  }
} catch (error) {
  console.error('❌ Stripe initialization error:', error.message);
  console.log('💡 Direct payment system will be used instead');
}

// Create payment intent for auction
exports.createPaymentIntent = async (req, res) => {
    try {
        // Check if Stripe is enabled
        if (!stripeEnabled || !stripe) {
            return res.status(503).json({ 
                message: "Stripe payment not available. Please use direct payment instead.",
                useDirectPayment: true
            });
        }

        const { auctionId } = req.params;
        const userId = req.user._id;

        const auction = await Auction.findById(auctionId).populate('seller', 'name email');
        
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Check if user is the winner
        if (auction.winner?.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not the winner of this auction" });
        }

        // Check if already paid
        if (auction.paymentStatus === 'completed') {
            return res.status(400).json({ message: "Payment already completed" });
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(auction.currentBid * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                auctionId: auctionId,
                auctionTitle: auction.title,
                sellerId: auction.seller._id.toString(),
                sellerName: auction.seller.name,
                buyerId: userId.toString()
            },
            description: `Payment for auction: ${auction.title}`
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: auction.currentBid,
            auctionTitle: auction.title
        });

    } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: "Failed to create payment intent" });
    }
};

// Confirm payment and update auction
exports.confirmPayment = async (req, res) => {
    try {
        // Check if Stripe is enabled
        if (!stripeEnabled || !stripe) {
            return res.status(503).json({ 
                message: "Stripe payment not available. Please use direct payment instead.",
                useDirectPayment: true
            });
        }

        const { auctionId } = req.params;
        const { paymentIntentId } = req.body;
        const userId = req.user._id;

        const auction = await Auction.findById(auctionId).populate('seller winner');
        
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        if (auction.winner?.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not the winner" });
        }

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            // Update auction payment status
            auction.paymentStatus = 'completed';
            auction.paymentDate = new Date();
            auction.paymentIntentId = paymentIntentId;
            await auction.save();

            // Update seller stats
            const seller = await User.findById(auction.seller._id);
            seller.stats.auctionsSold += 1;
            seller.stats.totalEarned += auction.currentBid;
            await seller.save();
            await seller.checkAndAwardBadges();

            // Emit real-time payment notification
            const io = req.app.get('io');
            if (io) {
                // Notify seller
                io.to(`user-${auction.seller._id}`).emit('payment-received', {
                    auctionId: auction._id,
                    auctionTitle: auction.title,
                    amount: auction.currentBid,
                    buyerName: auction.winner.name,
                    message: `Payment received for "${auction.title}"!`
                });

                // Notify buyer
                io.to(`user-${userId}`).emit('payment-confirmed', {
                    auctionId: auction._id,
                    auctionTitle: auction.title,
                    amount: auction.currentBid,
                    message: `Payment confirmed for "${auction.title}"!`
                });
            }

            res.json({
                success: true,
                message: "Payment confirmed successfully!",
                auction: auction
            });
        } else {
            res.status(400).json({ message: "Payment not successful" });
        }

    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ message: "Failed to confirm payment" });
    }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const auction = await Auction.findById(auctionId).select('paymentStatus paymentDate currentBid');
        
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        res.json({
            paymentStatus: auction.paymentStatus,
            paymentDate: auction.paymentDate,
            amount: auction.currentBid
        });

    } catch (error) {
        console.error("Error getting payment status:", error);
        res.status(500).json({ message: "Failed to get payment status" });
    }
};

// Process refund (admin/seller only)
exports.processRefund = async (req, res) => {
    try {
        // Check if Stripe is enabled
        if (!stripeEnabled || !stripe) {
            return res.status(503).json({ 
                message: "Stripe refund not available.",
                useDirectPayment: true
            });
        }

        const { auctionId } = req.params;
        const auction = await Auction.findById(auctionId);
        
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        if (auction.paymentStatus !== 'completed' || !auction.paymentIntentId) {
            return res.status(400).json({ message: "No payment to refund" });
        }

        // Process refund with Stripe
        const refund = await stripe.refunds.create({
            payment_intent: auction.paymentIntentId
        });

        if (refund.status === 'succeeded') {
            auction.paymentStatus = 'refunded';
            auction.refundDate = new Date();
            await auction.save();

            // Emit real-time refund notification
            const io = req.app.get('io');
            if (io) {
                io.to(`user-${auction.winner}`).emit('payment-refunded', {
                    auctionId: auction._id,
                    auctionTitle: auction.title,
                    amount: auction.currentBid,
                    message: `Refund processed for "${auction.title}"`
                });
            }

            res.json({
                success: true,
                message: "Refund processed successfully",
                refund: refund
            });
        } else {
            res.status(400).json({ message: "Refund failed" });
        }

    } catch (error) {
        console.error("Error processing refund:", error);
        res.status(500).json({ message: "Failed to process refund" });
    }
};
