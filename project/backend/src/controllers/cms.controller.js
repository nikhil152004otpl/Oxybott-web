const cmsService = require('../services/cms.service');
const { recordAuditLog } = require('../middleware/auth');

class CmsController {
  // --- Public Endpoints ---
  async getPage(req, res) {
    try {
      const page = await cmsService.getPageBySlug(req.params.slug);
      if (!page) return res.status(404).json({ success: false, error: 'Page not found.' });
      res.json({ success: true, page });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getNavigationMenu(req, res) {
    try {
      const menu = await cmsService.getNavigationMenu(req.params.menuKey);
      if (!menu) return res.status(404).json({ success: false, error: 'Navigation menu not found.' });
      res.json({ success: true, menu });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getFaqs(req, res) {
    try {
      const faqs = await cmsService.getFaqs(req.query.category);
      res.json({ success: true, count: faqs.length, faqs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Admin Endpoints ---
  async adminGetAllPages(req, res) {
    try {
      const pages = await cmsService.getAllPagesAdmin();
      res.json({ success: true, pages });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminUpdatePage(req, res) {
    try {
      const { id } = req.params;
      await cmsService.updatePage(id, req.body);
      await recordAuditLog(req, 'UPDATE_PAGE', 'CMS_PAGE', id, `Updated page metadata for "${id}"`);
      res.json({ success: true, message: 'Page updated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminUpdateSection(req, res) {
    try {
      const { id } = req.params;
      await cmsService.updateSection(id, req.body);
      await recordAuditLog(req, 'UPDATE_SECTION', 'CMS_SECTION', id, `Updated section "${req.body.title || id}"`);
      res.json({ success: true, message: 'Section updated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminReorderSections(req, res) {
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) return res.status(400).json({ success: false, error: 'Orders must be an array.' });
      await cmsService.reorderSections(orders);
      res.json({ success: true, message: 'Section order updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminGetAllNavigation(req, res) {
    try {
      const menus = await cmsService.getAllNavigationAdmin();
      res.json({ success: true, menus });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminCreateNavigationItem(req, res) {
    try {
      const id = await cmsService.createNavigationItem(req.body);
      await recordAuditLog(req, 'CREATE_NAV_ITEM', 'NAVIGATION', id, `Created nav link "${req.body.label}"`);
      res.status(201).json({ success: true, message: 'Navigation item added.', id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminUpdateNavigationItem(req, res) {
    try {
      const { id } = req.params;
      await cmsService.updateNavigationItem(id, req.body);
      await recordAuditLog(req, 'UPDATE_NAV_ITEM', 'NAVIGATION', id, `Updated nav link "${req.body.label || id}"`);
      res.json({ success: true, message: 'Navigation item updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminDeleteNavigationItem(req, res) {
    try {
      const { id } = req.params;
      await cmsService.deleteNavigationItem(id);
      await recordAuditLog(req, 'DELETE_NAV_ITEM', 'NAVIGATION', id, `Deleted nav link ${id}`);
      res.json({ success: true, message: 'Navigation item deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminGetAllFaqs(req, res) {
    try {
      const faqs = await cmsService.getAllFaqsAdmin();
      res.json({ success: true, faqs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminCreateFaq(req, res) {
    try {
      const id = await cmsService.createFaq(req.body);
      await recordAuditLog(req, 'CREATE_FAQ', 'FAQ', id, `Created FAQ "${req.body.question}"`);
      res.status(201).json({ success: true, message: 'FAQ created successfully.', id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminUpdateFaq(req, res) {
    try {
      const { id } = req.params;
      await cmsService.updateFaq(id, req.body);
      await recordAuditLog(req, 'UPDATE_FAQ', 'FAQ', id, `Updated FAQ "${id}"`);
      res.json({ success: true, message: 'FAQ updated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminDeleteFaq(req, res) {
    try {
      const { id } = req.params;
      await cmsService.deleteFaq(id);
      await recordAuditLog(req, 'DELETE_FAQ', 'FAQ', id, `Deleted FAQ ${id}`);
      res.json({ success: true, message: 'FAQ deleted successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new CmsController();

