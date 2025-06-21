const express = require('express')
const AdminController = require('../controllers/adminController')
const auth = require('../middleware/authMiddleware')
const requireRole = require('../middleware/roleGuard')

const router = express.Router()

// Fetch users awaiting verification
router.get('/pending-users', auth, requireRole('ADMIN'), AdminController.getPendingUsers)

// Update user status
router.patch('/users/:id/status', auth, requireRole('ADMIN'), AdminController.updateUserStatus)

// List all users with optional role/status filters
router.get('/users', auth, requireRole('ADMIN'), AdminController.listAllUsers)

module.exports = router