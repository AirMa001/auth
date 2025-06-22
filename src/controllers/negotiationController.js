const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')

class NegotiationController {
  static async initSession(req, res) {
    try {
      const session = await prisma.negotiationSession.create({
        data: { orderId: req.params.id, messages: [], status: 'ACTIVE' }
      })
      ResponseHelper.success(res, 'Negotiation session started', session)
    } catch (err) {
      console.error('Init negotiation error:', err)
      ResponseHelper.error(res, 'Failed to start negotiation', err)
    }
  }

  static async addMessage(req, res) {
    try {
      const { senderId, message } = req.body
      const timestamp = new Date().toISOString()
      const session = await prisma.negotiationSession.update({
        where: { orderId: req.params.id },
        data: {
          messages: { push: { senderId, message, timestamp } }
        }
      })
      ResponseHelper.success(res, 'Message added', session)
    } catch (err) {
      console.error('Add message error:', err)
      ResponseHelper.error(res, 'Failed to add message', err)
    }
  }

  static async updateNegotiation(req, res) {
    try {
      const { status } = req.body
      if (!['ACTIVE','ACCEPTED','REJECTED'].includes(status)) {
        return ResponseHelper.error(res, 'Invalid status')
      }
      const session = await prisma.negotiationSession.update({
        where: { orderId: req.params.id },
        data: { status }
      })
      ResponseHelper.success(res, `Negotiation ${status.toLowerCase()}`, session)
    } catch (err) {
      console.error('Update negotiation error:', err)
      ResponseHelper.error(res, 'Failed to update negotiation', err)
    }
  }
}

module.exports = NegotiationController
