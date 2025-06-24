const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')
const fileService = require('../services/fileService')

class ProductListingController {
  static async createListing(req, res) {
      try {
        const {
          title,
          location,
          pricePerUnit,
          availableFrom,
          availableTo, 
          farmer,
          category,
          variety,
          unitOfMeasure
        } = req.body;

        const quantityAvailable = parseFloat(req.body.quantityAvailable);
        const parsedPrice = parseFloat(pricePerUnit);

        // collect uploaded files
        const photoFiles = req.files.photos || []
        const videoFiles = req.files.videos || []

        // enforce limits
        if (photoFiles.length > 10) {
          return ResponseHelper.validationError(res, [{ field: 'photos', message: 'Max 10 photos allowed' }])
        }
        if (videoFiles.length > 5) {
          return ResponseHelper.validationError(res, [{ field: 'videos', message: 'Max 5 videos allowed' }])
        }

        // upload all and get signed URLs
        const photoUrls = await fileService.uploadMultipleAndGetSignedUrls(photoFiles)
        const videoUrls = await fileService.uploadMultipleAndGetSignedUrls(videoFiles)

        const newListing = await prisma.productListing.create({
          data: {
            title,
            location,
            quantityAvailable,
            pricePerUnit: parsedPrice,
            availableFrom: new Date(availableFrom),
            availableTo: new Date(availableTo),
            farmer,
            unitOfMeasure,
            category,
            variety,
            photos: photoUrls,
            videoUrl: videoUrls[0] || null  // store first video link
          }
        });

        const io = req.app.get('socketio');
        io.emit('listingCreated', newListing);

        ResponseHelper.success(res, 'Product listing created', newListing);
      } catch (err) {
        console.error('Create listing error:', err);
      ResponseHelper.error(res, 'Failed to create listing', err);
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

  static async updateListingStatus(req, res) {
    try {
      const listing = await prisma.productListing.findUnique({
        where: { id: req.params.id }
      })
      const newStatus = !listing.isActive
      const updated = await prisma.productListing.update({
        where: { id: req.params.id },
        data: { isActive: newStatus }
      })
      const io = req.app.get('socketio')
      io.emit('listingStatusChanged', updated)

      ResponseHelper.success(res, 'Listing status changed', updated)
    } catch (err) {
      console.error('Update listing status error:', err)
      ResponseHelper.error(res, 'Failed to change listing status', err)
    }
  }

  

  static async placeOrder(req, res) {
  try {
    const { productId, quantityOrdered } = req.body;
    const product = await prisma.productListing.findUnique({
      where: { id: productId }
    });
    if (!product) {
      return ResponseHelper.error(res, 'Product not found');
    }
    if (product.quantityAvailable < quantityOrdered) {
      return ResponseHelper.error(res, 'Not enough stock available');
    }
    // Decrease the available quantity
    const updatedProduct = await prisma.productListing.update({
      where: { id: productId },
      data: {
        quantityAvailable: product.quantityAvailable - quantityOrdered
      }
    });

    // (Optional) Save order details
    const order = await prisma.order.create({
      data: {
        productId,
        quantity: quantityOrdered,
        status: 'success', // assuming you have status tracking
        // add other details like buyerId, timestamp, etc.
      }
    });
    ResponseHelper.success(res, 'Order placed successfully', {
      order,
      updatedProduct
    });
  } catch (err) {
    console.error('Place order error:', err);
    ResponseHelper.error(res, 'Failed to place order', err);
  }
}
}

module.exports = ProductListingController

module.exports = ProductListingController
