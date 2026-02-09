const mongoose = require('mongoose');
const Auction = require('./models/Auction');

mongoose.connect('mongodb://127.0.0.1:27017/auctionDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all auctions with bids but no winner
    const auctions = await Auction.find({ 
      bids: { $exists: true, $ne: [] },
      winner: null 
    });
    
    console.log(`Found ${auctions.length} auctions to fix`);
    
    for (const auction of auctions) {
      if (auction.bids && auction.bids.length > 0) {
        // Find highest bid
        let highestBid = auction.bids[0];
        for (const bid of auction.bids) {
          if (bid.amount > highestBid.amount) {
            highestBid = bid;
          }
        }
        
        // Set winner to highest bidder - update directly without triggering validation
        await Auction.updateOne(
          { _id: auction._id },
          { 
            $set: { 
              winner: highestBid.userId || highestBid.bidder,
              'bids.$[].bidder': highestBid.userId || highestBid.bidder
            }
          }
        );
        
        console.log(`Fixed auction: ${auction.title}, Winner: ${highestBid.userId || highestBid.bidder}`);
      }
    }
    
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
