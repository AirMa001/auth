const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const ProductSearchController = require('../controllers/ProductSearchController')

// Debug: log when this router file is loaded
console.log('Loaded productSearch.routes.js')

// Search and discovery routes
router.get('/', auth, ProductSearchController.searchProducts)

// Removed saved searches routes as per the latest changes

module.exports = router