const express = require('express');
const router = express.Router();
const softwareController = require('../controllers/software.controller');

// Public Software & Downloads Endpoints
router.get('/', (req, res) => softwareController.getSoftwareCatalog(req, res));
router.get('/download/:releaseId', (req, res) => softwareController.downloadRelease(req, res));

module.exports = router;

