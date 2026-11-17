const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const inquiriesController = require('../controllers/inquiries.controller');

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many inquiries submitted from this connection. Please wait a few minutes before trying again.' }
});

router.post('/', inquiryLimiter, (req, res) => inquiriesController.createInquiry(req, res));

module.exports = router;

