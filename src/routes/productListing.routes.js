const express = require('express')
const router = express.Router()
const multer = require("multer");
const ProductListingController = require('../controllers/productListingController')
const auth = require('../middleware/authMiddleware')
const upload = multer();


router.use(auth)

// accept up to 10 photos and 5 videos on create
router.post(
  '/',
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]),
  ProductListingController.createListing
)

router.get('/',     ProductListingController.getAllListings)
router.get('/:id',  ProductListingController.getListingById)
router.patch('/:id',  ProductListingController.updateListing)
router.delete('/:id', ProductListingController.deleteListing)
router.patch('/:id/status',   ProductListingController.updateListingStatus)


module.exports = router
