const settingsService = require('../services/settings.service');
const { recordAuditLog } = require('../middleware/auth');

class SettingsController {
  async getPublicSettings(req, res) {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminGetSettings(req, res) {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminUpdateSettings(req, res) {
    try {
      const { settings } = req.body;
      await settingsService.updateSettings(settings);
      await recordAuditLog(req, 'UPDATE_SETTINGS', 'SETTINGS', 'GLOBAL', 'Updated site configuration settings');
      res.json({ success: true, message: 'Settings saved successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new SettingsController();

