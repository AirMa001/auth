const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')
const { sendEmail } = require('../utils/emailService')

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

      // Notify other party
      await prisma.notification.create({
        data: {
          userId: session.order.buyerId === req.user.userId
                  ? session.order.farmerId
                  : session.order.buyerId,
          type: 'NEW_MESSAGE',
          content: `Negotiation ${status.toLowerCase()} for order ${req.params.id}`,
          relatedId: req.params.id
        }
      })
      const otherPartyEmail = (await prisma.user.findUnique({
        where: { id: session.order.buyerId === req.user.userId ? session.order.farmerId : session.order.buyerId },
        select: { email: true }
      })).email

      sendEmail(
        otherPartyEmail,          // fetch from DB: the other party’s email
        'Negotiation Updated',
        `Your negotiation for order ${req.params.id} is now ${status}`
      )
      ResponseHelper.success(res, `Negotiation ${status.toLowerCase()}`, session)
    } catch (err) {
      console.error('Update negotiation error:', err)
      ResponseHelper.error(res, 'Failed to update negotiation', err)
    }
  }
}

// Add to Cart (stores in BuyerProfile.savedSearches as a temporary cart store)
const addToCart = async (req, res) => {
  try {
    const { userId } = req.params
    const { productListingId, quantity } = req.body

    const buyer = await prisma.buyerProfile.findUnique({ where: { userId } })
    if (!buyer) return ResponseHelper.error(res, 'Buyer not found')

    const cart = buyer.savedSearches?.cart || []
    cart.push({ productListingId, quantity })

    const updated = await prisma.buyerProfile.update({
      where: { userId },
      data: { savedSearches: { ...buyer.savedSearches, cart } }
    })

    return ResponseHelper.success(res, 'Item added to cart', updated.savedSearches.cart)
  } catch (err) {
    console.error('Add to cart error:', err)
    return ResponseHelper.error(res, 'Failed to add to cart')
  }
}

// Place Direct Order (skips cart)
const placeDirectOrder = async (req, res) => {
  try {
    const { buyerId } = req.params
    const { productListingId, quantity, deliveryAddressId, logisticsType } = req.body

    const listing = await prisma.productListing.findUnique({
      where: { id: productListingId },
      include: { farmer: true }
    })

    if (!listing) return ResponseHelper.error(res, 'Product listing not found')
    if (quantity > listing.quantityAvailable) return ResponseHelper.error(res, 'Not enough quantity available')

    // enforce minimum order quantity
    if (quantity < listing.minOrderQuantity) {
      return ResponseHelper.validationError(res, [
        { field:'quantity', message:`Must order at least ${listing.minOrderQuantity}` }
      ])
    }

    const price = listing.pricePerUnit
    const totalAmount = quantity * price
    const commissionFee = totalAmount * 0.05 // 5% commission example
    const finalAmount = totalAmount + commissionFee

    const order = await prisma.order.create({
      data: {
        buyerId,
        farmerId: listing.farmerId,
        totalAmount,
        commissionFee,
        finalAmount,
        deliveryAddressId,
        logisticsType,
        items: {
          create: {
            productListingId,
            quantity,
            unitOfMeasure: listing.unitOfMeasure.name,
            priceAtTimeOfOrder: price
          }
        }
      },
      include: { items: true }
    })

    // initial transaction record
    await prisma.transaction.create({
      data: {
        userId: req.params.buyerId,
        orderId: order.id,
        amount: order.totalAmount,
        type: 'PAYMENT',
        status: 'PENDING'
      }
    })

    // notify farmer
    await prisma.notification.create({
      data:{
        userId: order.farmerId,
        type: 'NEW_ORDER',
        content: `New order ${order.id} from buyer ${req.params.buyerId}`,
        relatedId: order.id
      }
    })
    // send email to farmer
    const farmer = await prisma.user.findUnique({ where:{ id:order.farmerId }})
    sendEmail(farmer.email, 'New Order Received', `Order ${order.id} placed.`)

    // Decrement inventory
    await prisma.productListing.update({
      where: { id: productListingId },
      data: { quantityAvailable: { decrement: quantity } }
    })

    return ResponseHelper.success(res, 'Order placed successfully', order)
  } catch (err) {
    console.error('Direct order error:', err)
    return ResponseHelper.error(res, 'Failed to place order')
  }
}

// Move this from ProductListingController
async function placeOrder(req, res) {
  try {
    const { productId, quantityOrdered } = req.body;
    const product = await prisma.productListing.findUnique({
      where: { id: productId }
    });
    if (!product) return ResponseHelper.error(res, 'Product not found');
    if (product.quantityAvailable < quantityOrdered) {
      return ResponseHelper.error(res, 'Not enough stock available');
    }
    // Decrease the available quantity
    const updatedProduct = await prisma.productListing.update({
      where: { id: productId },
      data: { quantityAvailable: product.quantityAvailable - quantityOrdered }
    });
    // Save order
    const order = await prisma.order.create({
      data: {
        buyerId: req.user.userId,
        farmerId: product.farmerId,
        totalAmount: quantityOrdered * product.pricePerUnit,
        commissionFee: (quantityOrdered * product.pricePerUnit) * 0.05,
        finalAmount: (quantityOrdered * product.pricePerUnit) * 1.05,
        logisticsType: 'BUYER_PICKUP', // or accept from req.body
        items: {
          create: {
            productListingId: productId,
            quantity: quantityOrdered,
            unitOfMeasure: product.unitOfMeasure,
            priceAtTimeOfOrder: product.pricePerUnit
          }
        }
      },
      include: { items: true }
    });
    ResponseHelper.success(res, 'Order placed successfully', { order, updatedProduct });
  } catch (err) {
    console.error('Place order error:', err);
    ResponseHelper.error(res, 'Failed to place order', err);
  }
}

// order summary
async function getOrderSummary(req, res) {
  try {
    const order = await prisma.order.findUnique({
      where:{ id:req.params.orderId },
      include:{ items:true, farmer:true, buyer:true }
    })
    if(!order) return ResponseHelper.error(res,'Order not found')
    ResponseHelper.success(res,'Order summary', order)
  } catch(e) {
    ResponseHelper.error(res,'Failed to fetch summary', e)
  }
}

// buyer history
async function buyerOrderHistory(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where:{ buyerId:req.params.buyerId },
      include:{ items:true, farmer:true }
    })
    ResponseHelper.success(res,'Buyer order history', orders)
  } catch(e) {
    ResponseHelper.error(res,'Failed to fetch buyer history', e)
  }
}

// farmer history
async function farmerOrderHistory(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where:{ farmerId:req.params.farmerId },
      include:{ items:true, buyer:true }
    })
    ResponseHelper.success(res,'Farmer order history', orders)
  } catch(e) {
    ResponseHelper.error(res,'Failed to fetch farmer history', e)
  }
}

module.exports = {
  NegotiationController,
  addToCart,
  placeDirectOrder,
  placeOrder,
  getOrderSummary,
  buyerOrderHistory,
  farmerOrderHistory
}

