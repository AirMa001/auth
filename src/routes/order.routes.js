const express = require('express')
const router = express.Router()
const {NegotiationController, addToCart, placeDirectOrder} = require('../controllers/negotiationAndOrderController')

// ...existing code for other order endpoints...

// negotiation endpoints
router.post('/:id/negotiate',     NegotiationController.initSession)
router.post('/:id/negotiate/msg', NegotiationController.addMessage)
router.put('/:id/negotiate',      NegotiationController.updateNegotiation)


// Add to cart (temporary JSON method)
router.post('/cart/add/:userId', addToCart)

// Direct order
router.post('/direct/:buyerId', placeDirectOrder)

module.exports = router
