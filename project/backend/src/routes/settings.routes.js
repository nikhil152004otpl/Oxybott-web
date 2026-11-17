const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

// Public endpoints
router.get('/', (req, res) => settingsController.getPublicSettings(req, res));

module.exports = router;

