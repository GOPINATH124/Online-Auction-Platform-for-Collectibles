const express = require("express");
const router = express.Router();
const { getOrCreateChat, sendMessage, markAsRead, getUnreadCount } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// Get unread message count - MUST come before /:auctionId
router.get("/unread/count", protect, getUnreadCount);

// Get or create chat for an auction
router.get("/:auctionId", protect, getOrCreateChat);

// Send a message
router.post("/:auctionId/message", protect, sendMessage);

// Mark messages as read
router.put("/:auctionId/read", protect, markAsRead);
module.exports = router;