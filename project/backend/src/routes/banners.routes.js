const express = require('express');
const router = express.Router();
const bannersController = require('../controllers/banners.controller');

// Public endpoints
router.get('/', (req, res) => bannersController.getActiveBanners(req, res));

module.exports = router;

