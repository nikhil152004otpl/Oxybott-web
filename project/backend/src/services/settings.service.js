const { query } = require('../config/db');

class SettingsService {
  async getSettings() {
    const res = await query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    res.rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    return settings;
  }

  async updateSettings(settingsObj) {
    if (!settingsObj || typeof settingsObj !== 'object') {
      throw new Error('Invalid settings object.');
    }

    for (const [key, value] of Object.entries(settingsObj)) {
      await query(`
        INSERT INTO site_settings (setting_key, setting_value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_at = CURRENT_TIMESTAMP
      `, [key, String(value)]);
    }
  }
}

module.exports = new SettingsService();

