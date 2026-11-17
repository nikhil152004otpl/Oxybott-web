const adminService = require('../services/admin.service');

class AdminController {
  async getDashboardStats(req, res) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAuditLogs(req, res) {
    try {
      const logs = await adminService.getAuditLogs(req.query.limit || 50);
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AdminController();

