const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')

class CatalogController {
  // list all categories
  static async listCategories(req, res) {
    const cats = await prisma.cropCategory.findMany()
    return ResponseHelper.success(res, 'Categories fetched', cats)
  }
  // get single category with its varieties
  static async getCategory(req, res) {
    const cat = await prisma.cropCategory.findUnique({
      where:{ id: req.params.id },
      include:{ varieties: true }
    })
    if (!cat) return ResponseHelper.error(res,'Category not found')
    return ResponseHelper.success(res,'Category fetched', cat)
  }

  // list all varieties
  static async listVarieties(req, res) {
    const vars = await prisma.cropVariety.findMany({ include:{ category: true } })
    return ResponseHelper.success(res,'Varieties fetched', vars)
  }
  // get one variety
  static async getVariety(req, res) {
    const v = await prisma.cropVariety.findUnique({
      where:{ id: req.params.id },
      include:{ category: true }
    })
    if (!v) return ResponseHelper.error(res,'Variety not found')
    return ResponseHelper.success(res,'Variety fetched', v)
  }
  // list varieties by category
  static async listVarietiesByCategory(req, res) {
    const vars = await prisma.cropVariety.findMany({
      where:{ categoryId: req.params.id },
      include:{ category: true }
    })
    return ResponseHelper.success(res,'Varieties fetched', vars)
  }

  // list all units
  static async listUnits(req, res) {
    const units = await prisma.unitOfMeasure.findMany()
    return ResponseHelper.success(res,'Units fetched', units)
  }
  // get a single unit
  static async getUnit(req, res) {
    const u = await prisma.unitOfMeasure.findUnique({ where:{ id: req.params.id } })
    if (!u) return ResponseHelper.error(res,'Unit not found')
    return ResponseHelper.success(res,'Unit fetched', u)
  }
}

module.exports = CatalogController
