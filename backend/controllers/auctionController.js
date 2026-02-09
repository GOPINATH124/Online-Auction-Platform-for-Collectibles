const Auction = require("../models/Auction");
const cloudinary = require("../config/cloudinary");
const emailService = require("../utils/emailService");
const User = require("../models/User");

// Create new auction (only sellers)
const createAuction = async (req, res) => {
  try {
    console.log("Creating auction with data:", req.body);
    console.log("User:", req.user);
    
    if (!req.user.isSeller) {
      console.log("User is not a seller");
      return res.status(403).json({ message: "Only sellers can create auctions" });
    }

    // Validate end time is in the future
    const endTime = new Date(req.body.endTime);
    const now = new Date();
    if (endTime <= now) {
      console.log("End time is in the past");
      return res.status(400).json({ message: "Auction end time must be in the future" });
    }

    // Upload images to Cloudinary if provided
    const images = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          // Convert buffer to base64
          const b64 = Buffer.from(file.buffer).toString('base64');
          const dataURI = `data:${file.mimetype};base64,${b64}`;
          
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'auctions',
            resource_type: 'auto'
          });
          
          images.push({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError.message);
        console.log("Creating auction without images...");
        // Continue without images instead of failing
      }
    }

    const auction = await Auction.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      startingPrice: req.body.startingPrice,
      currentBid: req.body.startingPrice,
      buyNowPrice: req.body.buyNowPrice || null,
      buyNowEnabled: req.body.buyNowEnabled || false,
      seller: req.user._id,
      endTime: req.body.endTime,
      images: images
    });

    console.log("Auction created successfully:", auction._id);
    res.status(201).json(auction);
  } catch (error) {
    console.error("Error creating auction:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get all auctions
const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find();
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get auction by ID
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    res.json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Pay for auction (winner only)
const payAuction = async (req, res) => {
  try {
    console.log('=== PAYMENT REQUEST ===');
    console.log('Auction ID:', req.params.id);
    console.log('User ID:', req.user._id.toString());
    
    const auction = await Auction.findById(req.params.id).populate('seller');
    if (!auction) {
      console.log('ERROR: Auction not found');
      return res.status(404).json({ message: "Auction not found" });
    }

    console.log('Auction winner:', auction.winner);
    console.log('Is paid:', auction.isPaid);

    if (!auction.winner) {
      console.log('ERROR: No winner for this auction');
      return res.status(403).json({ message: "This auction has no winner yet" });
    }

    if (auction.winner !== req.user._id.toString()) {
      console.log('ERROR: User is not the winner');
      return res.status(403).json({ message: "You are not the winner of this auction" });
    }

    if (auction.isPaid) {
      console.log('ERROR: Already paid');
      return res.status(400).json({ message: "Payment already completed" });
    }

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    auction.isPaid = true;
    auction.paymentDetails = {
      method: req.body.method || 'Direct Payment',
      paidAt: new Date(),
      transactionId: transactionId,
      amount: auction.currentBid
    };
    await auction.save();

    console.log('SUCCESS: Payment completed');

    // Get winner details for email
    const winner = await User.findById(auction.winner);

    // Send email notification to seller
    try {
      await emailService.sendPaymentReceivedNotification(
        auction.seller.email,
        auction.seller.name,
        auction.title,
        auction.currentBid,
        winner.name,
        transactionId
      );
      console.log('Payment notification email sent to seller');
    } catch (emailError) {
      console.error('Failed to send payment notification email:', emailError);
      // Don't fail the payment if email fails
    }

    res.json({ 
      message: "Payment successful", 
      auction,
      transactionId: transactionId
    });
  } catch (error) {
    console.error('ERROR in payment:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update auction (seller only)
const updateAuction = async (req, res) => {
  try {
    console.log('=== UPDATE AUCTION REQUEST ===');
    console.log('Auction ID:', req.params.id);
    console.log('User ID:', req.user._id);
    console.log('Request body:', req.body);
    console.log('Files:', req.files?.length || 0);
    
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      console.log('ERROR: Auction not found');
      return res.status(404).json({ message: "Auction not found" });
    }

    console.log('Auction seller:', auction.seller.toString());
    console.log('Bids count:', auction.bids.length);

    // Check if user is the seller
    if (auction.seller.toString() !== req.user._id.toString()) {
      console.log('ERROR: User is not the seller');
      return res.status(403).json({ message: "You can only update your own auctions" });
    }

    // Don't allow updates if auction has bids
    if (auction.bids.length > 0) {
      console.log('ERROR: Auction has bids, cannot update');
      return res.status(400).json({ message: "Cannot update auction with existing bids" });
    }

    // Update fields
    const { title, description, category, startingPrice, endTime } = req.body;
    
    if (title) auction.title = title;
    if (description) auction.description = description;
    if (category) auction.category = category;
    if (startingPrice) {
      auction.startingPrice = startingPrice;
      auction.currentBid = startingPrice;
    }
    if (endTime) {
      const newEndTime = new Date(endTime);
      if (newEndTime <= new Date()) {
        return res.status(400).json({ message: "End time must be in the future" });
      }
      auction.endTime = newEndTime;
    }

    // Handle image updates if provided
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const image of auction.images) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }

      // Upload new images
      const images = [];
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'auctions',
          resource_type: 'auto'
        });
        
        images.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
      auction.images = images;
    }

    await auction.save();
    console.log('SUCCESS: Auction updated successfully');
    res.json({ message: "Auction updated successfully", auction });
  } catch (error) {
    console.error('ERROR updating auction:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete auction (seller only)
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Check if user is the seller
    if (auction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own auctions" });
    }

    // Don't allow deletion if auction has bids
    if (auction.bids.length > 0) {
      return res.status(400).json({ message: "Cannot delete auction with existing bids" });
    }

    // Delete images from Cloudinary
    for (const image of auction.images) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    }

    await Auction.findByIdAndDelete(req.params.id);
    res.json({ message: "Auction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createAuction,
  getAuctions,
  getAuctionById,
  payAuction,
  updateAuction,
  deleteAuction
};
