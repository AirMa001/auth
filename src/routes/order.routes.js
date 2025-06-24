const express = require('express')
const router = express.Router()
const {NegotiationController, addToCart, placeDirectOrder, placeOrder, getOrderSummary, buyerOrderHistory, farmerOrderHistory} = require('../controllers/negotiationAndOrderController')

// negotiation endpoints
router.post('/:id/negotiate',     NegotiationController.initSession)
router.post('/:id/negotiate/msg', NegotiationController.addMessage)
router.put('/:id/negotiate',      NegotiationController.updateNegotiation)


// Add to cart (temporary JSON method)
router.post('/cart/add/:userId', addToCart)

// Direct order
router.post('/direct/:buyerId', placeDirectOrder)

// place order (from product listing)
router.post('/order', placeOrder)

// order summary before confirmation
router.get('/summary/:orderId', getOrderSummary)

// order history
router.get('/history/buyer/:buyerId', buyerOrderHistory)
router.get('/history/farmer/:farmerId', farmerOrderHistory)

module.exports = router
