const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documents.controller');

router.get('/:id/download', (req, res) => documentsController.downloadDocument(req, res));
router.get('/:id/view', (req, res) => documentsController.viewDocument(req, res));

module.exports = router;

