const cron = require('node-cron');
const Auction = require('../models/Auction');
const User = require('../models/User');
const emailService = require('./emailService');

// Payment deadline in milliseconds (1 hour)
const PAYMENT_DEADLINE = 60 * 60 * 1000; // 1 hour

// Check for unpaid auctions every 5 minutes
const checkUnpaidAuctions = async () => {
  try {
    const now = new Date();
    
    // Find ended auctions that are unpaid and past the deadline
    // Exclude auctions that were already transferred to 2nd bidder
    const auctions = await Auction.find({
      endTime: { $lt: now },
      isPaid: false,
      winner: { $exists: true, $ne: null },
      transferredToSecondBidder: { $ne: true } // Don't transfer again
    }).populate('seller').populate('winner');

    for (const auction of auctions) {
      const endTime = new Date(auction.endTime);
      const timeSinceEnd = now - endTime;

      // If payment deadline passed (1 hour after auction end)
      if (timeSinceEnd > PAYMENT_DEADLINE) {
        console.log(`⏰ Payment deadline passed for auction: ${auction.title}`);
        
        // Get second highest bidder
        const sortedBids = auction.bids.sort((a, b) => b.amount - a.amount);
        
        if (sortedBids.length >= 2) {
          const secondHighestBid = sortedBids[1];
          const secondBidder = await User.findById(secondHighestBid.bidder);
          
          // Transfer auction to second highest bidder
          const previousWinner = auction.winner;
          auction.winner = secondBidder._id.toString();
          auction.currentBid = secondHighestBid.amount;
          auction.paymentDeadlineMissed = true;
          auction.transferredToSecondBidder = true; // Mark as transferred - no more transfers
          auction.finalTransferTime = new Date(); // Record when transfer happened
          
          await auction.save();

          console.log(`✅ Auction transferred to second highest bidder: ${secondBidder.name}`);
          console.log(`🔒 No more transfers will occur for this auction`);

          // Send email to new winner
          try {
            await emailService.sendAuctionWinNotification(
              secondBidder.email,
              secondBidder.name,
              auction.title,
              auction.currentBid
            );
          } catch (emailError) {
            console.error('Failed to send email to new winner:', emailError);
          }

          // Send email to previous winner (payment deadline missed)
          try {
            const prevWinnerUser = await User.findById(previousWinner);
            if (prevWinnerUser && prevWinnerUser.email) {
              await emailService.sendPaymentDeadlineMissedNotification(
                prevWinnerUser.email,
                prevWinnerUser.name,
                auction.title,
                auction.currentBid
              );
            }
          } catch (emailError) {
            console.error('Failed to send deadline missed email:', emailError);
          }

          // Notify seller
          try {
            if (auction.seller && auction.seller.email) {
              const prevWinnerUser = await User.findById(previousWinner);
              await emailService.sendWinnerChangedNotification(
                auction.seller.email,
                auction.seller.name,
                auction.title,
                prevWinnerUser.name,
                secondBidder.name,
                auction.currentBid
              );
            }
          } catch (emailError) {
            console.error('Failed to send seller notification:', emailError);
          }

        } else {
          // No second bidder, mark auction as failed
          console.log(`❌ No second bidder for auction: ${auction.title}`);
          auction.paymentFailed = true;
          auction.transferredToSecondBidder = true; // Prevent checking again
          await auction.save();
        }
      }
    }
  } catch (error) {
    console.error('Error in auction scheduler:', error);
  }
};

// Start the scheduler (runs every 5 minutes)
const startAuctionScheduler = () => {
  console.log('🕒 Auction payment scheduler started (checks every 5 minutes)');
  
  // Run immediately on startup
  checkUnpaidAuctions();
  
  // Schedule to run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('⏰ Running payment deadline check...');
    checkUnpaidAuctions();
  });
};

module.exports = { startAuctionScheduler };
