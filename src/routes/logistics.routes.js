const express = require('express');
const LogisticsController = require('../controllers/logisticsController');
const router = express.Router();

// Admin assigns a partner
router.post('/assign', LogisticsController.assignPartner);

// Partner updates delivery status
router.patch('/status/:assignmentId', LogisticsController.updateStatus);

// Partner fetches their orders
router.get('/my-assignments', LogisticsController.getMyAssignments);

module.exports = router;
