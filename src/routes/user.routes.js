const express = require("express");
const multer = require("multer");
const UserController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleGuard");

const upload = multer();
const router = express.Router();

// get current user profile
router.get("/me", auth, UserController.getCurrentUser);

// complete profile (role selection + details)
router.put("/me/profile", auth, UserController.completeProfile);

// admin: list all users
router.get("/admin/users", auth, requireRole("ADMIN"), UserController.listAllUsers);

// upload profile picture
router.post(
  "/me/profile-picture",
  auth,
  upload.single("file"),
  UserController.uploadProfilePicture
);

// admin: suspend/deactivate user
router.patch(
  "/admin/users/:id/status",
  auth,
  requireRole("ADMIN"),
  UserController.updateUserStatus
);
// admin: edit user (incl. bio for farmers)
router.put(
  "/admin/users/:id",
  auth,
  requireRole("ADMIN"),
  UserController.editUser
);

// reviews: submit & list
router.post(
  "/:id/reviews",
  auth,
  UserController.submitReview
);
router.get(
  "/:id/reviews",
  auth,
  UserController.getReviews
);

// address book CRUD
router.get('/me/addresses',                 auth, UserController.listAddresses)
router.post('/me/addresses',                auth, UserController.createAddress)
router.put('/me/addresses/:addressId',      auth, UserController.updateAddress)
router.delete('/me/addresses/:addressId',   auth, UserController.deleteAddress)

module.exports = router;