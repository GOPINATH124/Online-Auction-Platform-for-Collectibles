const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getAllUsers, getProfile, updateProfile, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", protect, getAllUsers);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
