const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const PaymentController = require('../controllers/paymentController')

// initialize transaction
router.post('/initiate', auth, PaymentController.initializePayment)
// verify after callback
router.get('/verify', auth, PaymentController.verifyPayment)
// Paystack webhook (no auth)
router.post('/webhook', express.json(), PaymentController.handleWebhook)
// release escrow (buyer confirms delivery)
router.post('/release/:orderId', auth, PaymentController.releaseEscrow)
// user transaction history
router.get('/history', auth, PaymentController.getTransactionHistory)

module.exports = router
