const express = require('express')
const router = express.Router()
const {NegotiationController, setLogisticsPreference, addToCart, placeDirectOrder} = require('../controllers/negotiationAndOrderController')

// ...existing code for other order endpoints...

// negotiation endpoints
router.post('/:id/negotiate',     NegotiationController.initSession)
router.post('/:id/negotiate/msg', NegotiationController.addMessage)
router.put('/:id/negotiate',      NegotiationController.updateNegotiation)


// Add to cart (temporary JSON method)
router.post('/cart/add/:userId', addToCart)

// Direct order
router.post('/direct/:buyerId', placeDirectOrder)

// Farmer sets logistics preference
router.patch('/:orderId/logistics-preference', setLogisticsPreference);


module.exports = router
