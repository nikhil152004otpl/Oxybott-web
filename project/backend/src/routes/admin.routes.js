const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { requireAdminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { documentUpload } = require('../middleware/documentUpload');

const authController = require('../controllers/auth.controller');
const adminController = require('../controllers/admin.controller');
const productsController = require('../controllers/products.controller');
const categoriesController = require('../controllers/categories.controller');
const bannersController = require('../controllers/banners.controller');
const settingsController = require('../controllers/settings.controller');
const inquiriesController = require('../controllers/inquiries.controller');
const documentsController = require('../controllers/documents.controller');
const tutorialsController = require('../controllers/tutorials.controller');
const cmsController = require('../controllers/cms.controller');
const softwareController = require('../controllers/software.controller');
const mediaController = require('../controllers/media.controller');
const { softwareUpload } = require('../middleware/softwareUpload');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' }
});

// Authentication
router.post('/auth/login', loginLimiter, (req, res) => authController.login(req, res));
router.get('/auth/me', requireAdminAuth, (req, res) => authController.getMe(req, res));
router.post('/auth/logout', (req, res) => authController.logout(req, res));
router.post('/auth/change-password', requireAdminAuth, (req, res) => authController.changePassword(req, res));

// Dashboard Stats & Audit Logs
router.get('/stats', requireAdminAuth, (req, res) => adminController.getDashboardStats(req, res));
router.get('/audit-logs', requireAdminAuth, (req, res) => adminController.getAuditLogs(req, res));

// Products Management
router.get('/products', requireAdminAuth, (req, res) => productsController.adminGetProducts(req, res));
router.get('/products/:id', requireAdminAuth, (req, res) => productsController.adminGetProductById(req, res));
router.post('/products', requireAdminAuth, (req, res) => productsController.adminCreateProduct(req, res));
router.put('/products/:id', requireAdminAuth, (req, res) => productsController.adminUpdateProduct(req, res));
router.patch('/products/:id/publish', requireAdminAuth, (req, res) => productsController.adminTogglePublish(req, res));
router.post('/products/:id/duplicate', requireAdminAuth, (req, res) => productsController.adminDuplicateProduct(req, res));
router.delete('/products/:id', requireAdminAuth, (req, res) => productsController.adminDeleteProduct(req, res));

// Product Images
router.post('/products/:id/images', requireAdminAuth, upload.array('images', 10), (req, res) => productsController.uploadProductImages(req, res));
router.patch('/products/:id/images/:imageId/main', requireAdminAuth, (req, res) => productsController.setMainImage(req, res));
router.delete('/products/:id/images/:imageId', requireAdminAuth, (req, res) => productsController.deleteProductImage(req, res));

// Product Documents Management (Tutorials & Assembly Guides)
router.get('/products/:productId/documents', requireAdminAuth, (req, res) => documentsController.getDocumentsByProduct(req, res));
router.post('/products/:productId/documents', requireAdminAuth, documentUpload.single('file'), (req, res) => documentsController.uploadDocument(req, res));
router.put('/documents/:id', requireAdminAuth, documentUpload.single('file'), (req, res) => documentsController.replaceDocument(req, res));
router.delete('/documents/:id', requireAdminAuth, (req, res) => documentsController.deleteDocument(req, res));

// Categories Management
router.get('/categories', requireAdminAuth, (req, res) => categoriesController.adminGetCategories(req, res));
router.post('/categories', requireAdminAuth, (req, res) => categoriesController.adminCreateCategory(req, res));
router.put('/categories/:id', requireAdminAuth, (req, res) => categoriesController.adminUpdateCategory(req, res));
router.delete('/categories/:id', requireAdminAuth, (req, res) => categoriesController.adminDeleteCategory(req, res));

// Banners Management
router.get('/banners', requireAdminAuth, (req, res) => bannersController.adminGetBanners(req, res));
router.post('/banners', requireAdminAuth, (req, res) => bannersController.adminCreateBanner(req, res));
router.put('/banners/:id', requireAdminAuth, (req, res) => bannersController.adminUpdateBanner(req, res));
router.delete('/banners/:id', requireAdminAuth, (req, res) => bannersController.adminDeleteBanner(req, res));

// Settings
router.get('/settings', requireAdminAuth, (req, res) => settingsController.adminGetSettings(req, res));
router.put('/settings', requireAdminAuth, (req, res) => settingsController.adminUpdateSettings(req, res));

// Inquiries & Leads Management
router.get('/inquiries', requireAdminAuth, (req, res) => inquiriesController.adminGetInquiries(req, res));
router.patch('/inquiries/:id', requireAdminAuth, (req, res) => inquiriesController.adminUpdateInquiryStatus(req, res));
router.delete('/inquiries/:id', requireAdminAuth, (req, res) => inquiriesController.adminDeleteInquiry(req, res));

// Tutorials Management (Manual & Fetch from Product)
router.get('/tutorials', requireAdminAuth, (req, res, next) => tutorialsController.getAllTutorialsAdmin(req, res, next));
router.get('/tutorials/fetch-product/:productId', requireAdminAuth, (req, res, next) => tutorialsController.getProductTutorialData(req, res, next));
router.post('/tutorials', requireAdminAuth, documentUpload.single('file'), (req, res, next) => tutorialsController.createTutorial(req, res, next));
router.put('/tutorials/:id', requireAdminAuth, documentUpload.single('file'), (req, res, next) => tutorialsController.updateTutorial(req, res, next));
router.delete('/tutorials/:id', requireAdminAuth, (req, res, next) => tutorialsController.deleteTutorial(req, res, next));

// CMS Pages & Sections Management
router.get('/cms/pages', requireAdminAuth, (req, res) => cmsController.adminGetAllPages(req, res));
router.put('/cms/pages/:id', requireAdminAuth, (req, res) => cmsController.adminUpdatePage(req, res));
router.put('/cms/sections/:id', requireAdminAuth, (req, res) => cmsController.adminUpdateSection(req, res));
router.put('/cms/sections-reorder', requireAdminAuth, (req, res) => cmsController.adminReorderSections(req, res));

// CMS Navigation Management
router.get('/cms/navigation', requireAdminAuth, (req, res) => cmsController.adminGetAllNavigation(req, res));
router.post('/cms/navigation', requireAdminAuth, (req, res) => cmsController.adminCreateNavigationItem(req, res));
router.put('/cms/navigation/:id', requireAdminAuth, (req, res) => cmsController.adminUpdateNavigationItem(req, res));
router.delete('/cms/navigation/:id', requireAdminAuth, (req, res) => cmsController.adminDeleteNavigationItem(req, res));

// CMS FAQ Items Management
router.get('/cms/faqs', requireAdminAuth, (req, res) => cmsController.adminGetAllFaqs(req, res));
router.post('/cms/faqs', requireAdminAuth, (req, res) => cmsController.adminCreateFaq(req, res));
router.put('/cms/faqs/:id', requireAdminAuth, (req, res) => cmsController.adminUpdateFaq(req, res));
router.delete('/cms/faqs/:id', requireAdminAuth, (req, res) => cmsController.adminDeleteFaq(req, res));

// Software & Releases Management
router.get('/software', requireAdminAuth, (req, res) => softwareController.adminGetAllSoftware(req, res));
router.post('/software', requireAdminAuth, (req, res) => softwareController.adminCreateSoftware(req, res));
router.put('/software/:id', requireAdminAuth, (req, res) => softwareController.adminUpdateSoftware(req, res));
router.delete('/software/:id', requireAdminAuth, (req, res) => softwareController.adminDeleteSoftware(req, res));
router.post('/software/:id/releases', requireAdminAuth, softwareUpload.single('file'), (req, res) => softwareController.adminAddRelease(req, res));
router.delete('/software/releases/:releaseId', requireAdminAuth, (req, res) => softwareController.adminDeleteRelease(req, res));

// Media Library Management
router.get('/media', requireAdminAuth, (req, res) => mediaController.adminGetMediaAssets(req, res));
router.post('/media/upload', requireAdminAuth, upload.single('file'), (req, res) => mediaController.adminUploadMediaAsset(req, res));
router.delete('/media/:id', requireAdminAuth, (req, res) => mediaController.adminDeleteMediaAsset(req, res));

module.exports = router;

