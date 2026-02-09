const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkey";

// -------------------
// REGISTER
// -------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, isSeller } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isSeller: isSeller || false,
    });

    // Create JWT token
    const token = jwt.sign({ id: user._id, isSeller: user.isSeller }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, user: { _id: user._id, name, email, isSeller: user.isSeller } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// -------------------
// LOGIN
// -------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Create JWT token
    const token = jwt.sign({ id: user._id, isSeller: user.isSeller }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { _id: user._id, name: user.name, email, isSeller: user.isSeller } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
