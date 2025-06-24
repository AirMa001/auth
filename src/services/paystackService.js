const axios = require('axios')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()

const axiosClient = axios.create({
  baseURL: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
  }
})

class PaystackService {
  // now takes userId; no more wallet logic
  static async initializePayment(userId, email, amount, orderId, channels = []) {
    if (!orderId) throw new Error('Order ID is required')
    const { data: { data } } = await axiosClient.post('/transaction/initialize', {
      email, amount, channels, metadata: { orderId }
    })
    // record transaction
    await prisma.transaction.create({
      data: {
        userId, orderId,
        amount: amount/100,
        type: 'PAYMENT',
        status: 'PENDING',
        gatewayReference: data.reference
      }
    })
    return data
  }

  static async verifyPayment(reference) {
    try {
      const { data: { data } } = await axiosClient.get(`/transaction/verify/${reference}`)
      return data
    } catch (error) {
      console.error('Verify payment error:', error)
      throw new Error('Failed to verify payment')
    }
  }

  // 1) (Optional) create & store farmer’s recipient code
  static async createRecipient(accountName, accountNumber, bankCode, userId) {
    const { data: { data } } = await axiosClient.post('/transferrecipient', {
      type: 'nuban',
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    })
    const code = data.recipient_code
    // store on farmerProfile.verificationDocs
    const farmer = await prisma.farmerProfile.findUnique({ where: { userId } })
    const docs = farmer.verificationDocs || {}
    await prisma.farmerProfile.update({
      where: { userId },
      data: { verificationDocs: { ...docs, paystackRecipientCode: code } }
    })
    return code
  }

  // 2) on charge.success, release escrow to farmer
  static async settleFunds(orderId) {
    // fetch order & recipient code
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { farmer: { select: { userId:true, verificationDocs:true } } }
    })
    const recipientCode = order.farmer.verificationDocs?.paystackRecipientCode
    // calculate amounts in kobo
    const totalKobo = Math.round(order.totalAmount*100)
    const commissionKobo = Math.round(order.commissionFee*100)
    const netKobo = totalKobo - commissionKobo

    // transfer net to farmer
    const { data: { data } } = await axiosClient.post('/transfer', {
      source: 'balance',
      recipient: recipientCode,
      amount: netKobo,
      reason: `Payout for order ${orderId}`
    })
    // record farmer payout
    await prisma.transaction.create({
      data: {
        userId: order.farmer.userId,
        orderId,
        amount: netKobo/100,
        type: 'PAYOUT',
        status: 'PENDING',
        gatewayReference: data.reference
      }
    })
    return data
  }

  // only handle order payments
  static async handleWebhook(req, res) {
    let attempts = 0
    const max = 3
    while (attempts++ < max) {
      try {
        const sig = req.headers['x-paystack-signature'] || ''
        const hash = require('crypto')
          .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
          .update(JSON.stringify(req.body))
          .digest('hex')
        if (hash !== sig) return res.status(400).send('Invalid signature')

        const { event, data } = req.body
        const { metadata, reference } = data

        if (event === 'charge.success') {
          const orderId = metadata.orderId
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'SUCCESSFUL' }
          })
          await prisma.transaction.updateMany({
            where: { gatewayReference: reference },
            data: { status: 'SUCCESSFUL' }
          })
          await this.settleFunds(orderId)
        }

        return res.sendStatus(200)
      } catch (err) {
        console.error(`Webhook handler attempt ${attempts} failed:`, err)
        if (attempts >= max) return res.sendStatus(500)
      }
    }
  }
}

module.exports = PaystackService
