const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  participants: [{
    userId: { type: String, required: true },
    name: { type: String, required: true }
  }],
  messages: [{
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Chat", chatSchema);
