const { query } = require('../config/db');

class BannersService {
  async getActiveBanners() {
    const res = await query('SELECT * FROM banners WHERE is_active = TRUE ORDER BY sort_order ASC');
    return res.rows;
  }

  async adminGetBanners() {
    const res = await query('SELECT * FROM banners ORDER BY sort_order ASC');
    return res.rows;
  }

  async createBanner(data) {
    const { title, subtitle, image_url, cta_text, cta_link, is_active, sort_order } = data;
    const res = await query(`
      INSERT INTO banners (title, subtitle, image_url, cta_text, cta_link, is_active, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [title, subtitle, image_url, cta_text, cta_link, is_active ? true : false, parseInt(sort_order || 0, 10)]);
    return res.rows[0].id;
  }

  async updateBanner(id, data) {
    const { title, subtitle, image_url, cta_text, cta_link, is_active, sort_order } = data;
    await query(`
      UPDATE banners SET title = $1, subtitle = $2, image_url = $3, cta_text = $4, cta_link = $5, is_active = $6, sort_order = $7
      WHERE id = $8
    `, [title, subtitle, image_url, cta_text, cta_link, is_active ? true : false, parseInt(sort_order || 0, 10), id]);
  }

  async deleteBanner(id) {
    await query('DELETE FROM banners WHERE id = $1', [id]);
  }
}

module.exports = new BannersService();

