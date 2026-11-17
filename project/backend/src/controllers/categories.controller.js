const categoriesService = require('../services/categories.service');
const { recordAuditLog } = require('../middleware/auth');

class CategoriesController {
  async getPublishedCategories(req, res) {
    try {
      const categories = await categoriesService.getPublishedCategories();
      res.json({ success: true, categories });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminGetCategories(req, res) {
    try {
      const categories = await categoriesService.adminGetCategories();
      res.json({ success: true, categories });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminCreateCategory(req, res) {
    try {
      const id = await categoriesService.createCategory(req.body);
      await recordAuditLog(req, 'CREATE_CATEGORY', 'CATEGORY', id, `Created category "${req.body.name}"`);
      res.status(201).json({ success: true, id });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminUpdateCategory(req, res) {
    try {
      const { id } = req.params;
      await categoriesService.updateCategory(id, req.body);
      await recordAuditLog(req, 'UPDATE_CATEGORY', 'CATEGORY', id, `Updated category "${req.body.name}"`);
      res.json({ success: true, message: 'Category updated.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminDeleteCategory(req, res) {
    try {
      const { id } = req.params;
      await categoriesService.deleteCategory(id);
      await recordAuditLog(req, 'DELETE_CATEGORY', 'CATEGORY', id, `Deleted category ${id}`);
      res.json({ success: true, message: 'Category deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new CategoriesController();

