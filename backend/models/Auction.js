// 1️⃣ IMPORT MONGOOSE
const mongoose = require("mongoose");

// 2️⃣ CREATE SCHEMA
const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'Other' },
  startingPrice: { type: Number, required: true },
  currentBid: { type: Number, default: 0 },
  buyNowPrice: { type: Number, default: null },
  buyNowEnabled: { type: Boolean, default: false },
  soldViaBuyNow: { type: Boolean, default: false },
  buyNowBuyer: { type: String, default: null },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{
    url: { type: String },
    publicId: { type: String }
  }],
  bids: [{ 
    userId: { type: String },
    bidder: { type: String },
    amount: { type: Number } 
  }],
  autoBids: [{
    userId: { type: String },
    bidderName: { type: String },
    maxAmount: { type: Number },
    currentProxyBid: { type: Number },
    isActive: { type: Boolean, default: true }
  }],
  endTime: { type: Date, required: true },
  winner: { type: String, default: null },
  isFlagged: { type: Boolean, default: false },
  flagReports: [{
    userId: { type: String },
    reason: { type: String },
    description: { type: String },
    reportedAt: { type: Date, default: Date.now }
  }],
  isPaid: { type: Boolean, default: false },
  paymentDeadlineMissed: { type: Boolean, default: false },
  paymentFailed: { type: Boolean, default: false },
  transferredToSecondBidder: { type: Boolean, default: false }, // Prevents re-transfer
  finalTransferTime: { type: Date, default: null }, // When transfer happened
  paymentDetails: {
    method: { type: String }, // 'QR Code' or 'Direct Payment'
    paidAt: { type: Date },
    transactionId: { type: String },
    amount: { type: Number }
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'refunded', 'failed'], 
    default: 'pending' 
  },
  paymentIntentId: { type: String },
  paymentDate: { type: Date },
  refundDate: { type: Date }
}, {
  timestamps: true
});

// 3️⃣ EXPORT MODEL
module.exports = mongoose.model("Auction", auctionSchema);
