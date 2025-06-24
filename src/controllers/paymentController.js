const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')
const PaystackService = require('../services/paystackService')

class PaymentController {
  // initialize a transaction
  static async initializePayment(req, res) {
    const { email, amount, orderId, channels } = req.body
    if (!orderId) {
      return ResponseHelper.validationError(res, [{ field: 'orderId', message: 'Required' }])
    }
    try {
      const initData = await PaystackService.initializePayment(
        req.user.userId,
        email,
        amount,
        orderId,
        channels
      )
      return ResponseHelper.success(res, 'Payment initialized', initData)
    } catch (err) {
      console.error('Init payment error:', err)
      return ResponseHelper.error(res, 'Failed to initialize payment', err.message)
    }
  }

  // verify payment by reference
  static async verifyPayment(req, res) {
    try {
      const { reference } = req.query
      const verifyData = await PaystackService.verifyPayment(reference)
      return ResponseHelper.success(res, 'Payment verified', verifyData)
    } catch (err) {
      console.error('Verify payment error:', err)
      return ResponseHelper.error(res, 'Failed to verify payment', err.message)
    }
  }

  // webhook handler (no auth header)
  static async handleWebhook(req, res) {
    // let the service manage retries & signature
    return PaystackService.handleWebhook(req, res)
  }

  // 5.7.5 release escrow once delivery confirmed
  static async releaseEscrow(req, res) {
    try {
      const { orderId } = req.params
      // mark order completed
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED', paymentStatus: 'SUCCESSFUL' }
      })
      // call paystack payout
      const payout = await PaystackService.settleFunds(orderId)
      return ResponseHelper.success(res, 'Escrow released', payout)
    } catch (err) {
      console.error('Release escrow error:', err)
      return ResponseHelper.error(res, 'Failed to release escrow', err)
    }
  }

  // 5.7.6 transaction history for current user
  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.userId
      const txns = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      return ResponseHelper.success(res, 'Transaction history fetched', txns)
    } catch (err) {
      console.error('Get tx history error:', err)
      return ResponseHelper.error(res, 'Failed to fetch transactions', err)
    }
  }
}

module.exports = PaymentController
