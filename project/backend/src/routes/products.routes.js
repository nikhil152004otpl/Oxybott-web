const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const documentsController = require('../controllers/documents.controller');

// Public endpoints
router.get('/', (req, res) => productsController.getProducts(req, res));
router.get('/:slugOrId', (req, res) => productsController.getProductBySlugOrId(req, res));
router.get('/:productId/documents', (req, res) => documentsController.getDocumentsByProduct(req, res));

module.exports = router;

