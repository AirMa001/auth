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

//prefered logistics type
const setLogisticsPreference = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { logisticsType } = req.body;
    const validOptions = ['FARMER_DELIVERY', 'PLATFORM_PARTNER', 'BUYER_PICKUP'];

    if (!validOptions.includes(logisticsType)) {
      return ResponseHelper.error(res, 'Invalid logistics option');
    //}

    // const updatedOrder = await prisma.order.update({
    //   where: { id: orderId },
    //   data: { logisticsType }
    }//);

    ResponseHelper.success(res, 'Logistics preference updated');
  } catch (err) {
    console.error('Set logistics preference error:', err);
    ResponseHelper.error(res, 'Failed to set logistics preference', err);
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

module.exports = {
  addToCart,
  placeDirectOrder,
  setLogisticsPreference,
  NegotiationController
}

