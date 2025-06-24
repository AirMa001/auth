const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const PaystackService = require('../services/paystackService')
const ResponseHelper = require('../utils/responseHelper')

class WalletController {
  static async getBalance(req, res) {
    const uid = req.user.userId
    const wallet = await prisma.wallet.upsert({
      where:{ userId: uid },
      create:{ userId: uid },
      update:{}
    })
    ResponseHelper.success(res, 'Wallet fetched', wallet)
  }

  static async initiateTopUp(req, res) {
    const uid = req.user.userId
    const { amount, channels } = req.body
    if (!amount) return ResponseHelper.validationError(res, [{ field:'amount', message:'Required' }])
    try {
      const init = await PaystackService.initializePayment(
        req.user.email,
        amount * 100,
        uid,           // use userId as “orderId” placeholder for wallet
        channels,
        'wallet'
      )
      ResponseHelper.success(res, 'Top-up initiated', init)
    } catch (err) {
      console.error('Top-up init error:', err)
      ResponseHelper.error(res, 'Failed to initiate top-up', err.message)
    }
  }
}

module.exports = WalletController
