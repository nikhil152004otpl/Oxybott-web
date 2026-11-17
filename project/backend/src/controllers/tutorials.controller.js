const tutorialsService = require('../services/tutorials.service');
const { recordAuditLog } = require('../middleware/auth');

class TutorialsController {
  /**
   * Public: List all published tutorials
   * GET /api/tutorials
   */
  async getPublishedTutorials(req, res, next) {
    try {
      const tutorials = await tutorialsService.getPublishedTutorials();
      res.json({
        success: true,
        count: tutorials.length,
        tutorials
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public: Get single tutorial
   * GET /api/tutorials/:id
   */
  async getTutorialById(req, res, next) {
    try {
      const tutorial = await tutorialsService.getTutorialById(req.params.id);
      if (!tutorial) {
        return res.status(404).json({ success: false, message: 'Tutorial not found' });
      }
      res.json({
        success: true,
        tutorial
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all tutorials
   * GET /api/admin/tutorials
   */
  async getAllTutorialsAdmin(req, res, next) {
    try {
      const tutorials = await tutorialsService.getAllTutorialsAdmin();
      res.json({
        success: true,
        count: tutorials.length,
        tutorials
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Get tutorial creation preview from product
   * GET /api/admin/tutorials/fetch-product/:productId
   */
  async getProductTutorialData(req, res, next) {
    try {
      const data = await tutorialsService.getProductTutorialData(req.params.productId);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Create new tutorial
   * POST /api/admin/tutorials
   */
  async createTutorial(req, res, next) {
    try {
      const payload = { ...req.body };

      // Handle any uploaded files if multipart
      if (req.files) {
        if (req.files.thumbnail && req.files.thumbnail[0]) {
          payload.thumbnail_url = `/uploads/products/${req.files.thumbnail[0].filename}`;
        }
        if (req.files.video && req.files.video[0]) {
          payload.video_file_path = `/uploads/videos/${req.files.video[0].filename}`;
        }
        if (req.files.pdf && req.files.pdf[0]) {
          payload.pdf_file_path = `/uploads/documents/${req.files.pdf[0].filename}`;
        }
      } else if (req.file) {
        // Single file upload fallback
        const ext = req.file.originalname.split('.').pop().toLowerCase();
        if (['mp4', 'webm', 'mov'].includes(ext)) {
          payload.video_file_path = `/uploads/videos/${req.file.filename}`;
        } else if (ext === 'pdf') {
          payload.pdf_file_path = `/uploads/documents/${req.file.filename}`;
        } else {
          payload.thumbnail_url = `/uploads/products/${req.file.filename}`;
        }
      }

      const tutorial = await tutorialsService.createTutorial(payload);

      await recordAuditLog(
        req,
        'CREATE_TUTORIAL',
        'TUTORIAL',
        tutorial.id,
        `Created tutorial "${tutorial.title}"`
      );

      res.status(201).json({
        success: true,
        message: 'Tutorial created successfully',
        tutorial
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Update tutorial
   * PUT /api/admin/tutorials/:id
   */
  async updateTutorial(req, res, next) {
    try {
      const payload = { ...req.body };

      if (req.files) {
        if (req.files.thumbnail && req.files.thumbnail[0]) {
          payload.thumbnail_url = `/uploads/products/${req.files.thumbnail[0].filename}`;
        }
        if (req.files.video && req.files.video[0]) {
          payload.video_file_path = `/uploads/videos/${req.files.video[0].filename}`;
        }
        if (req.files.pdf && req.files.pdf[0]) {
          payload.pdf_file_path = `/uploads/documents/${req.files.pdf[0].filename}`;
        }
      } else if (req.file) {
        const ext = req.file.originalname.split('.').pop().toLowerCase();
        if (['mp4', 'webm', 'mov'].includes(ext)) {
          payload.video_file_path = `/uploads/videos/${req.file.filename}`;
        } else if (ext === 'pdf') {
          payload.pdf_file_path = `/uploads/documents/${req.file.filename}`;
        } else {
          payload.thumbnail_url = `/uploads/products/${req.file.filename}`;
        }
      }

      const tutorial = await tutorialsService.updateTutorial(req.params.id, payload);

      await recordAuditLog(
        req,
        'UPDATE_TUTORIAL',
        'TUTORIAL',
        tutorial.id,
        `Updated tutorial "${tutorial.title}"`
      );

      res.json({
        success: true,
        message: 'Tutorial updated successfully',
        tutorial
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Delete tutorial
   * DELETE /api/admin/tutorials/:id
   */
  async deleteTutorial(req, res, next) {
    try {
      await tutorialsService.deleteTutorial(req.params.id);

      await recordAuditLog(
        req,
        'DELETE_TUTORIAL',
        'TUTORIAL',
        req.params.id,
        `Deleted tutorial with ID ${req.params.id}`
      );

      res.json({
        success: true,
        message: 'Tutorial deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TutorialsController();
