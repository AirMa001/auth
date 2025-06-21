const express = require("express");
const AuthController = require("../controllers/authController");
const router = express.Router();

router.post("/signup", AuthController.signup);
router.get("/verify-email", AuthController.verifyEmail);
router.post("/login", AuthController.login);

module.exports = router;
