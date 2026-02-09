const Chat = require("../models/Chat");
const Auction = require("../models/Auction");

// Get or create chat for an auction
const getOrCreateChat = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const userId = req.user._id.toString();
        const userName = req.user.name;

        const auction = await Auction.findById(auctionId).populate('seller');
        if (!auction) {
            return res.status(404).json({ message: "Auction not found" });
        }

        // Check if user is buyer or seller
        const sellerId = auction.seller._id.toString();
        const isSeller = sellerId === userId;
        const isBidder = auction.bids.some(bid => bid.userId === userId);

        if (!isSeller && !isBidder) {
            return res.status(403).json({ message: "You must bid on this auction to chat" });
        }

        // Find existing chat
        let chat = await Chat.findOne({ auctionId: auctionId });

        if (!chat) {
            // Create new chat
            const participants = [
                { userId: sellerId, name: auction.seller.name }
            ];

            if (!isSeller) {
                participants.push({ userId: userId, name: userName });
            }

            chat = new Chat({
                auctionId: auctionId,
                participants: participants,
                messages: []
            });

            await chat.save();
        } else {
            // Add participant if not already in chat
            const participantExists = chat.participants.some(p => p.userId === userId);
            if (!participantExists) {
                chat.participants.push({ userId: userId, name: userName });
                await chat.save();
            }
        }

        res.status(200).json({ chat });
    } catch (err) {
        console.error('Get/Create chat error:', err);
        res.status(500).json({ message: "Error accessing chat", error: err.message });
    }
};

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const { message } = req.body;
        const userId = req.user._id.toString();
        const userName = req.user.name;

        if (!message || message.trim() === '') {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        let chat = await Chat.findOne({ auctionId: auctionId });
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Add message
        const newMessage = {
            senderId: userId,
            senderName: userName,
            message: message,
            timestamp: new Date(),
            isRead: false
        };

        chat.messages.push(newMessage);
        await chat.save();

        // Emit Socket.io event for real-time messaging
        const io = req.app.get('io');
        if (io) {
            io.to(`chat-${auctionId}`).emit('new-message', {
                chatId: chat._id,
                message: newMessage
            });
        }

        res.status(200).json({ message: "Message sent", newMessage });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ message: "Error sending message", error: err.message });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
    try {
        const { auctionId } = req.params;
        const userId = req.user._id.toString();

        const chat = await Chat.findOne({ auctionId: auctionId });
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Mark all messages from other users as read
        chat.messages.forEach(msg => {
            if (msg.senderId !== userId) {
                msg.isRead = true;
            }
        });

        await chat.save();

        res.status(200).json({ message: "Messages marked as read" });
    } catch (err) {
        console.error('Mark as read error:', err);
        res.status(500).json({ message: "Error marking messages as read" });
    }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const chats = await Chat.find({
            'participants.userId': userId
        });

        let unreadCount = 0;
        chats.forEach(chat => {
            chat.messages.forEach(msg => {
                if (msg.senderId !== userId && !msg.isRead) {
                    unreadCount++;
                }
            });
        });

        res.status(200).json({ unreadCount });
    } catch (err) {
        console.error('Get unread count error:', err);
        res.status(500).json({ message: "Error getting unread count" });
    }
};

module.exports = {
    getOrCreateChat,
    sendMessage,
    markAsRead,
    getUnreadCount
};
