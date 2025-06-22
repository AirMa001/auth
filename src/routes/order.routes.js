const express = require('express')
const router = express.Router()
const NegotiationController = require('../controllers/negotiationController')

// ...existing code for other order endpoints...

// negotiation endpoints
router.post('/:id/negotiate',     NegotiationController.initSession)
router.post('/:id/negotiate/msg', NegotiationController.addMessage)
router.put('/:id/negotiate',      NegotiationController.updateNegotiation)

module.exports = router
