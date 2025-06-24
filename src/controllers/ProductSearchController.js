const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')

class ProductSearchController {
  static async searchProducts(req, res) {
    try {
      const filters = req.query
      const page = Number(filters.page) || 1
      const limit = Number(filters.limit) || 20
      const skip = (page - 1) * limit

      // Base query with filters
      let where = {
        isActive: true,
        availableFrom: { lte: new Date() },
        availableTo: { gte: new Date() }
      }

      // Keyword search
      if (filters.keyword) {
        where.OR = [
          { title: { contains: filters.keyword, mode: 'insensitive' } },
          { description: { contains: filters.keyword, mode: 'insensitive' } },
          {
            category: {
              name: { contains: filters.keyword, mode: 'insensitive' }
            }
          },
          {
            variety: {
              name: { contains: filters.keyword, mode: 'insensitive' }
            }
          }
        ]
      }

      // Apply filters
      if (filters.categoryId) where.categoryId = filters.categoryId
      if (filters.varietyId) where.varietyId = filters.varietyId
      if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' }

      // Quantity range
      if (filters.minQuantity || filters.maxQuantity) {
        where.quantityAvailable = {}
        if (filters.minQuantity) where.quantityAvailable.gte = Number(filters.minQuantity)
        if (filters.maxQuantity) where.quantityAvailable.lte = Number(filters.maxQuantity)
      }

      // Price range
      if (filters.minPrice || filters.maxPrice) {
        where.pricePerUnit = {}
        if (filters.minPrice) where.pricePerUnit.gte = Number(filters.minPrice)
        if (filters.maxPrice) where.pricePerUnit.lte = Number(filters.maxPrice)
      }

      // Farmer rating
      if (filters.minRating) {
        where.farmer = {
          averageRating: { gte: Number(filters.minRating) }
        }
      }

      // Availability dates
      if (filters.availableFrom) where.availableFrom = { gte: new Date(filters.availableFrom) }
      if (filters.availableTo) where.availableTo = { lte: new Date(filters.availableTo) }

      // Get listings with farmer info
      let listings = await prisma.productListing.findMany({
        where,
        include: {
          farmer: {
            select: {
              id: true,
              farmName: true,
              averageRating: true,
              totalReviews: true
            }
          },
          category: true,
          variety: true,
          unitOfMeasure: true
        },
        skip,
        take: limit
      })

      // Distance sorting if requested
      if (filters.sortBy === 'distance' && filters.userId) {
        const user = await prisma.user.findUnique({
          where: { id: filters.userId },
          include: { addresses: { where: { isDefault: true } } }
        })

        if (user?.addresses?.length) {
          const userLocation = user.addresses[0]
          listings = await Promise.all(listings.map(async (listing) => {
            if (listing.geoPoint) {
              const distance = await calculateDistance(userLocation.city, listing.geoPoint)
              return { ...listing, distance }
            }
            return listing
          }))
          listings.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        }
      }

      // Other sorting options
      if (filters.sortBy === 'price') {
        listings.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
      } else if (filters.sortBy === 'rating') {
        listings.sort((a, b) => (b.farmer.averageRating || 0) - (a.farmer.averageRating || 0))
      } else if (filters.sortBy === 'newest') {
        listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }

      // Save search history if user is logged in
      if (filters.userId) {
        await prisma.user.update({
          where: { id: filters.userId },
          data: {
            searchHistory: {
              push: {
                filters,
                timestamp: new Date(),
                resultCount: listings.length
              }
            }
          }
        })
      }
      console.log(`Search products: ${listings.length} listings found for filters:`, filters)
      ResponseHelper.success(res, `Products fetched successfully ${filters.value}`, {
        data: listings,
        pagination: {
          page,
          limit,
          total: await prisma.productListing.count({ where })
        },
        filters
      })
    } catch (err) {
      console.error('Search products error:', err)
      ResponseHelper.error(res, 'Failed to search products', err)
    }
  }
}

module.exports = ProductSearchController