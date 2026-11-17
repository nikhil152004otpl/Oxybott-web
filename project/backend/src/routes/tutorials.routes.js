const express = require('express');
const router = express.Router();
const tutorialsController = require('../controllers/tutorials.controller');

// Public endpoints
router.get('/', (req, res, next) => tutorialsController.getPublishedTutorials(req, res, next));
router.get('/:id', (req, res, next) => tutorialsController.getTutorialById(req, res, next));

module.exports = router;

