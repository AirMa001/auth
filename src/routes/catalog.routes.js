const express = require('express')
const auth = require('../middleware/authMiddleware')
const CatalogController = require('../controllers/catalogController')
const router = express.Router()

router.use(auth)

// categories
router.get('/categories',               CatalogController.listCategories)
router.get('/categories/:id',           CatalogController.getCategory)
// varieties
router.get('/varieties',                CatalogController.listVarieties)
router.get('/varieties/:id',            CatalogController.getVariety)
router.get('/categories/:id/varieties', CatalogController.listVarietiesByCategory)
// units
router.get('/units',                    CatalogController.listUnits)
router.get('/units/:id',                CatalogController.getUnit)

module.exports = router
