const express = require("express")
const registrationController = require("../controllers/regController.js")
//const { authenticate, authorize } = require("../middleware/auth")

const router = express.Router()


// Registration endpoint
router.post("/", registrationController.registerUser)

// Admin only registration statistics
// router.get("/stats", authenticate, authorize("ADMIN"), registrationController.getRegistrationStats)

module.exports = router
