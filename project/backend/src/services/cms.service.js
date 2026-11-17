const { query } = require('../config/db');

class CmsService {
  /**
   * Get page with all visible sections
   */
  async getPageBySlug(slug) {
    const pageRes = await query('SELECT * FROM pages WHERE slug = $1 AND is_published = TRUE', [slug]);
    if (pageRes.rows.length === 0) return null;
    const page = pageRes.rows[0];

    const sectionsRes = await query(
      'SELECT * FROM page_sections WHERE page_id = $1 AND is_visible = TRUE ORDER BY sort_order ASC',
      [page.id]
    );

    const sections = {};
    for (const sec of sectionsRes.rows) {
      let parsedData = {};
      try {
        parsedData = typeof sec.content_data === 'string' ? JSON.parse(sec.content_data) : (sec.content_data || {});
      } catch (e) {
        parsedData = {};
      }
      sections[sec.section_key] = {
        ...sec,
        content: parsedData
      };
    }

    return {
      ...page,
      sections
    };
  }

  /**
   * Admin get all pages with all sections (including hidden)
   */
  async getAllPagesAdmin() {
    const pagesRes = await query('SELECT * FROM pages ORDER BY title ASC');
    const pages = pagesRes.rows;

    for (const p of pages) {
      const secRes = await query('SELECT * FROM page_sections WHERE page_id = $1 ORDER BY sort_order ASC', [p.id]);
      p.sections = secRes.rows.map(sec => {
        let parsedData = {};
        try {
          parsedData = typeof sec.content_data === 'string' ? JSON.parse(sec.content_data) : (sec.content_data || {});
        } catch (e) {
          parsedData = {};
        }
        return {
          ...sec,
          content: parsedData
        };
      });
    }
    return pages;
  }

  /**
   * Update page metadata
   */
  async updatePage(id, data) {
    const { title, meta_title, meta_description, is_published } = data;
    await query(`
      UPDATE pages
      SET title = COALESCE($1, title),
          meta_title = COALESCE($2, meta_title),
          meta_description = COALESCE($3, meta_description),
          is_published = COALESCE($4, is_published),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [title, meta_title, meta_description, is_published, id]);
  }

  /**
   * Update section content
   */
  async updateSection(id, data) {
    const { tag, title, subtitle, description, content_data, is_visible, sort_order } = data;
    const jsonStr = typeof content_data === 'object' ? JSON.stringify(content_data) : content_data;

    await query(`
      UPDATE page_sections
      SET tag = COALESCE($1, tag),
          title = COALESCE($2, title),
          subtitle = COALESCE($3, subtitle),
          description = COALESCE($4, description),
          content_data = COALESCE($5, content_data),
          is_visible = COALESCE($6, is_visible),
          sort_order = COALESCE($7, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [tag, title, subtitle, description, jsonStr, is_visible, sort_order, id]);
  }

  /**
   * Reorder page sections
   */
  async reorderSections(orders) {
    for (const item of orders) {
      if (item.id && item.sort_order !== undefined) {
        await query('UPDATE page_sections SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
      }
    }
  }

  /**
   * Navigation: Get public menu items
   */
  async getNavigationMenu(menuKey) {
    const menuRes = await query('SELECT id, menu_key, title FROM navigation_menus WHERE menu_key = $1', [menuKey]);
    if (menuRes.rows.length === 0) return null;
    const menu = menuRes.rows[0];

    const itemsRes = await query(
      'SELECT * FROM navigation_items WHERE menu_id = $1 AND is_visible = TRUE ORDER BY sort_order ASC',
      [menu.id]
    );

    return {
      ...menu,
      items: itemsRes.rows
    };
  }

  /**
   * Navigation: Get all menus and items for admin
   */
  async getAllNavigationAdmin() {
    const menusRes = await query('SELECT * FROM navigation_menus ORDER BY menu_key ASC');
    const menus = menusRes.rows;

    for (const m of menus) {
      const itemsRes = await query('SELECT * FROM navigation_items WHERE menu_id = $1 ORDER BY sort_order ASC', [m.id]);
      m.items = itemsRes.rows;
    }
    return menus;
  }

  /**
   * Create Navigation item
   */
  async createNavigationItem(data) {
    const id = 'nav_' + Date.now() + '_' + Math.round(Math.random() * 1e4);
    const { menu_id, parent_id, label, url, target, badge, sort_order, is_visible } = data;
    await query(`
      INSERT INTO navigation_items (id, menu_id, parent_id, label, url, target, badge, sort_order, is_visible)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, menu_id, parent_id || null, label, url, target || '_self', badge || null, sort_order || 0, is_visible !== undefined ? is_visible : true]);
    return id;
  }

  /**
   * Update Navigation item
   */
  async updateNavigationItem(id, data) {
    const { label, url, target, badge, sort_order, is_visible } = data;
    await query(`
      UPDATE navigation_items
      SET label = COALESCE($1, label),
          url = COALESCE($2, url),
          target = COALESCE($3, target),
          badge = COALESCE($4, badge),
          sort_order = COALESCE($5, sort_order),
          is_visible = COALESCE($6, is_visible),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
    `, [label, url, target, badge, sort_order, is_visible, id]);
  }

  /**
   * Delete Navigation item
   */
  async deleteNavigationItem(id) {
    await query('DELETE FROM navigation_items WHERE id = $1', [id]);
  }

  /**
   * FAQs: Public get published FAQs
   */
  async getFaqs(category) {
    if (category && category !== 'All') {
      const res = await query('SELECT * FROM faq_items WHERE is_published = TRUE AND category = $1 ORDER BY sort_order ASC', [category]);
      return res.rows;
    }
    const res = await query('SELECT * FROM faq_items WHERE is_published = TRUE ORDER BY sort_order ASC');
    return res.rows;
  }

  /**
   * FAQs: Admin get all FAQs
   */
  async getAllFaqsAdmin() {
    const res = await query('SELECT * FROM faq_items ORDER BY sort_order ASC, created_at DESC');
    return res.rows;
  }

  /**
   * Create FAQ
   */
  async createFaq(data) {
    const id = 'faq_' + Date.now();
    const { category, question, answer, sort_order, is_published } = data;
    await query(`
      INSERT INTO faq_items (id, category, question, answer, sort_order, is_published)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, category || 'General', question, answer, sort_order || 0, is_published !== undefined ? is_published : true]);
    return id;
  }

  /**
   * Update FAQ
   */
  async updateFaq(id, data) {
    const { category, question, answer, sort_order, is_published } = data;
    await query(`
      UPDATE faq_items
      SET category = COALESCE($1, category),
          question = COALESCE($2, question),
          answer = COALESCE($3, answer),
          sort_order = COALESCE($4, sort_order),
          is_published = COALESCE($5, is_published),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [category, question, answer, sort_order, is_published, id]);
  }

  /**
   * Delete FAQ
   */
  async deleteFaq(id) {
    await query('DELETE FROM faq_items WHERE id = $1', [id]);
  }
}

module.exports = new CmsService();

