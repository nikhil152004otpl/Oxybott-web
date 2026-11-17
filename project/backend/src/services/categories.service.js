const { query } = require('../config/db');

class CategoriesService {
  async getPublishedCategories() {
    const res = await query(`
      SELECT c.*, 
        (SELECT COUNT(DISTINCT pc.product_id) 
         FROM product_categories pc 
         JOIN products p ON p.id = pc.product_id 
         WHERE pc.category_id = c.id AND p.is_published = TRUE) AS products_count
      FROM categories c
      WHERE c.is_published = TRUE
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    return res.rows.map(r => ({ ...r, products_count: parseInt(r.products_count, 10) }));
  }

  async adminGetCategories() {
    const res = await query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM product_categories WHERE category_id = c.id) AS products_count
      FROM categories c
      ORDER BY c.sort_order ASC, c.name ASC
    `);
    return res.rows.map(r => ({ ...r, products_count: parseInt(r.products_count, 10) }));
  }

  async createCategory(data) {
    const { name, slug, description, image_url, sort_order, is_published } = data;
    if (!name) throw new Error('Category name is required.');
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const res = await query(`
      INSERT INTO categories (name, slug, description, image_url, sort_order, is_published)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [name.trim(), finalSlug, description || '', image_url || '', parseInt(sort_order || 0, 10), is_published ? true : false]);

    return res.rows[0].id;
  }

  async updateCategory(id, data) {
    const { name, slug, description, image_url, sort_order, is_published } = data;
    await query(`
      UPDATE categories SET
        name = $1, slug = $2, description = $3, image_url = $4, sort_order = $5,
        is_published = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [name, slug, description, image_url, sort_order, is_published ? true : false, id]);
  }

  async deleteCategory(id) {
    await query('DELETE FROM categories WHERE id = $1', [id]);
  }
}

module.exports = new CategoriesService();

