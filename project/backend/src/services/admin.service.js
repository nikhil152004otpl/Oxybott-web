const { query } = require('../config/db');

class AdminService {
  async getDashboardStats() {
    const totalProd = parseInt((await query('SELECT COUNT(*) as c FROM products')).rows[0].c, 10);
    const pubProd = parseInt((await query('SELECT COUNT(*) as c FROM products WHERE is_published = TRUE')).rows[0].c, 10);
    const draftProd = parseInt((await query('SELECT COUNT(*) as c FROM products WHERE is_published = FALSE')).rows[0].c, 10);
    const lowStockProd = parseInt((await query('SELECT COUNT(*) as c FROM products WHERE stock_quantity <= low_stock_threshold')).rows[0].c, 10);
    const totalCat = parseInt((await query('SELECT COUNT(*) as c FROM categories')).rows[0].c, 10);

    const recentUpdates = (await query(`
      SELECT id, name, sku, price, stock_quantity, is_published, updated_at
      FROM products
      ORDER BY updated_at DESC
      LIMIT 5
    `)).rows.map(r => ({ ...r, price: Number(r.price) }));

    const recentAuditLogs = (await query(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 8
    `)).rows;

    return {
      totalProducts: totalProd,
      publishedProducts: pubProd,
      draftProducts: draftProd,
      lowStockProducts: lowStockProd,
      totalCategories: totalCat,
      recentUpdates,
      recentAuditLogs
    };
  }

  async getAuditLogs(limit = 50) {
    const res = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [parseInt(limit, 10)]);
    return res.rows;
  }
}

module.exports = new AdminService();

