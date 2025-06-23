const express = require('express')
const router = express.Router()
const ProductSearchController = require('../controllers/ProductSearchController')

// Debug: log when this router file is loaded
console.log('Loaded productSearch.routes.js')

// Search and discovery routes
router.get('/', ProductSearchController.searchProducts)
router.get('/suggestions', ProductSearchController.getSearchSuggestions)

// Saved searches routes
router.post('/saved/:userId', ProductSearchController.saveSearch)
router.get('/saved/:userId', ProductSearchController.getSavedSearches)
router.delete('/saved/:userId/:searchId', ProductSearchController.deleteSavedSearch)
router.patch('/saved/:userId/:searchId/toggle-alert', ProductSearchController.toggleSearchAlert)

module.exports = router