require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://online-auction-platform-for-collect-seven.vercel.app/",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());

// Make io accessible to routes
app.set('io', io);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
    console.log(`User joined auction room: auction-${auctionId}`);
  });

  socket.on('leave-auction', (auctionId) => {
    socket.leave(`auction-${auctionId}`);
    console.log(`User left auction room: auction-${auctionId}`);
  });

  // Join user-specific room for personal notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User joined personal room: user-${userId}`);
  });

  socket.on('leave-user-room', (userId) => {
    socket.leave(`user-${userId}`);
    console.log(`User left personal room: user-${userId}`);
  });

  // Chat room events
  socket.on('join-chat', (auctionId) => {
    socket.join(`chat-${auctionId}`);
    console.log(`User joined chat room: chat-${auctionId}`);
  });

  socket.on('leave-chat', (auctionId) => {
    socket.leave(`chat-${auctionId}`);
    console.log(`User left chat room: chat-${auctionId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Connect auth routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/auctions", require("./routes/auctionRoutes"));
app.use("/api/bids", require("./routes/bidRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// New features routes
app.use("/api/auto-bids", require("./routes/autoBidRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/auctions", require("./routes/buyNowRoutes"));
app.use("/api/users", require("./routes/userStatsRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

// Start auction payment scheduler
const { startAuctionScheduler } = require('./utils/auctionScheduler');
startAuctionScheduler();

// Test route
app.get("/", (req, res) => res.send("Server running"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
