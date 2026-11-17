const express = require('express');
const router = express.Router();

const productsRoutes = require('./products.routes');
const categoriesRoutes = require('./categories.routes');
const bannersRoutes = require('./banners.routes');
const inquiriesRoutes = require('./inquiries.routes');
const settingsRoutes = require('./settings.routes');
const documentsRoutes = require('./documents.routes');
const tutorialsRoutes = require('./tutorials.routes');
const cmsRoutes = require('./cms.routes');
const softwareRoutes = require('./software.routes');
const adminRoutes = require('./admin.routes');

// Mount routes
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/banners', bannersRoutes);
router.use('/inquiries', inquiriesRoutes);
router.use('/settings', settingsRoutes);
router.use('/documents', documentsRoutes);
router.use('/tutorials', tutorialsRoutes);
router.use('/cms', cmsRoutes);
router.use('/software', softwareRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

