const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')

class ProductListingController {
  static async createListing(req, res) {
    try {
      const newListing = await prisma.productListing.create({ data: req.body })
      // notify via socket
      const io = req.app.get('socketio')
      io.emit('listingCreated', newListing)

      ResponseHelper.success(res, 'Product listing created', newListing)
    } catch (err) {
      console.error('Create listing error:', err)
      ResponseHelper.error(res, 'Failed to create listing', err)
    }
  }

  static async getAllListings(req, res) {
    try {
      const listings = await prisma.productListing.findMany()
      ResponseHelper.success(res, 'Listings fetched', listings)
    } catch (err) {
      console.error('Get all listings error:', err)
      ResponseHelper.error(res, 'Failed to fetch listings', err)
    }
  }

  static async getListingById(req, res) {
    try {
      const listing = await prisma.productListing.findUnique({ where: { id: req.params.id } })
      if (!listing) return ResponseHelper.error(res, 'Listing not found')
      ResponseHelper.success(res, 'Listing fetched', listing)
    } catch (err) {
      console.error('Get listing error:', err)
      ResponseHelper.error(res, 'Failed to fetch listing', err)
    }
  }

  static async updateListing(req, res) {
    try {
      const updated = await prisma.productListing.update({
        where: { id: req.params.id },
        data: req.body
      })
      // notify via socket
      const io = req.app.get('socketio')
      io.emit('listingUpdated', updated)

      ResponseHelper.success(res, 'Listing updated', updated)
    } catch (err) {
      console.error('Update listing error:', err)
      ResponseHelper.error(res, 'Failed to update listing', err)
    }
  }

  static async deleteListing(req, res) {
    try {
      await prisma.productListing.delete({ where: { id: req.params.id } })
      // notify via socket
      const io = req.app.get('socketio')
      io.emit('listingDeleted', { id: req.params.id })

      ResponseHelper.success(res, 'Listing deleted')
    } catch (err) {
      console.error('Delete listing error:', err)
      ResponseHelper.error(res, 'Failed to delete listing', err)
    }
  }

  static async pauseListing(req, res) {
    try {
      const paused = await prisma.productListing.update({
        where: { id: req.params.id },
        data: { isActive: false }
      })
      const io = req.app.get('socketio')
      io.emit('listingPaused', paused)
      ResponseHelper.success(res, 'Listing paused', paused)
    } catch (err) {
      console.error('Pause listing error:', err)
      ResponseHelper.error(res, 'Failed to pause listing', err)
    }
  }

  static async unpauseListing(req, res) {
    try {
      const unpaused = await prisma.productListing.update({
        where: { id: req.params.id },
        data: { isActive: true }
      })
      const io = req.app.get('socketio')
      io.emit('listingUnpaused', unpaused)
      ResponseHelper.success(res, 'Listing unpaused', unpaused)
    } catch (err) {
      console.error('Unpause listing error:', err)
      ResponseHelper.error(res, 'Failed to unpause listing', err)
    }
  }
}

module.exports = ProductListingController
