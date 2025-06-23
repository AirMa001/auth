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


// Category routes
router.post('/category', auth, requireRole('ADMIN'), AdminController.addCategory);
router.get('/category', auth, requireRole('ADMIN'), AdminController.getAllCategory)
router.put('/category/:id', auth, requireRole('ADMIN'), AdminController.updateCategory);
router.delete('/category/:id', auth, requireRole('ADMIN'), AdminController.deleteCategory);

//variety routes
router.post('/variety', auth, requireRole('ADMIN'), AdminController.createVariety);
router.get('/variety', auth, requireRole('ADMIN'), AdminController.getAllVarieties);
router.put('/variety/:id', auth, requireRole('ADMIN'), AdminController.updateVariety);
router.delete('/variety/:id', auth, requireRole('ADMIN'), AdminController.deleteVariety);

//unit routes
router.post('/unit', auth, requireRole('ADMIN'), AdminController.createUnit);
router.get('/unit', auth, requireRole('ADMIN'), AdminController.getAllUnits);
router.put('/unit/:id', auth, requireRole('ADMIN'), AdminController.updateUnit);
router.delete('/unit/:id', auth, requireRole('ADMIN'), AdminController.deleteUnit);

//Broadcast message
router.post('/notifications/broadcast', AdminController.broadcast)




module.exports = router