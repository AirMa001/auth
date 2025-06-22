const express = require('express')
const router = express.Router()
const ProductListingController = require('../controllers/productListingController')

router.post('/',    ProductListingController.createListing)
router.get('/',     ProductListingController.getAllListings)
router.get('/:id',  ProductListingController.getListingById)
router.put('/:id',  ProductListingController.updateListing)
router.delete('/:id', ProductListingController.deleteListing)
router.patch('/:id/pause',   ProductListingController.pauseListing)
router.patch('/:id/unpause', ProductListingController.unpauseListing)

module.exports = router
