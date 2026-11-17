const bannersService = require('../services/banners.service');
const { recordAuditLog } = require('../middleware/auth');

class BannersController {
  async getActiveBanners(req, res) {
    try {
      const banners = await bannersService.getActiveBanners();
      res.json({ success: true, banners });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminGetBanners(req, res) {
    try {
      const banners = await bannersService.adminGetBanners();
      res.json({ success: true, banners });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminCreateBanner(req, res) {
    try {
      const { title } = req.body;
      const id = await bannersService.createBanner(req.body);
      await recordAuditLog(req, 'CREATE_BANNER', 'BANNER', id, `Created banner "${title}"`);
      res.status(201).json({ success: true, id });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminUpdateBanner(req, res) {
    try {
      const { id } = req.params;
      await bannersService.updateBanner(id, req.body);
      await recordAuditLog(req, 'UPDATE_BANNER', 'BANNER', id, `Updated banner "${req.body.title || id}"`);
      res.json({ success: true, message: 'Banner updated.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminDeleteBanner(req, res) {
    try {
      const { id } = req.params;
      await bannersService.deleteBanner(id);
      await recordAuditLog(req, 'DELETE_BANNER', 'BANNER', id, `Deleted banner ${id}`);
      res.json({ success: true, message: 'Banner deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new BannersController();

