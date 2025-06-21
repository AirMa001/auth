const express = require("express");
const UserController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleGuard");

const router = express.Router();

// get current user profile
router.get("/me", auth, UserController.getCurrentUser);

// complete profile (role selection + details)
router.put("/me/profile", auth, UserController.completeProfile);

// admin: list all users
router.get("/admin/users", auth, requireRole("ADMIN"), UserController.listAllUsers);

module.exports = router;