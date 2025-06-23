const express = require('express')
const router = express.Router()
const multer = require("multer");
const ProductListingController = require('../controllers/productListingController')

const upload = multer();

router.post('/',   ProductListingController.createListing)
router.get('/',     ProductListingController.getAllListings)
router.get('/:id',  ProductListingController.getListingById)
router.put('/:id',  ProductListingController.updateListing)
router.delete('/:id', ProductListingController.deleteListing)
router.patch('/:id/pause',   ProductListingController.pauseListing)
router.patch('/:id/unpause', ProductListingController.unpauseListing)
router.post('/create', upload.array('photos', 10), ProductListingController.createListing)
router.post('/order', ProductListingController.placeOrder);


module.exports = router
