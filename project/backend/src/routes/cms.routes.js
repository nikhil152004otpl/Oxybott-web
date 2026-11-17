const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cms.controller');

// Public CMS Endpoints
router.get('/pages/:slug', (req, res) => cmsController.getPage(req, res));
router.get('/navigation/:menuKey', (req, res) => cmsController.getNavigationMenu(req, res));
router.get('/faqs', (req, res) => cmsController.getFaqs(req, res));

module.exports = router;

