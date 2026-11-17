const { query } = require('../config/db');
const fs = require('fs');
const path = require('path');

class TutorialsService {
  /**
   * Get all published tutorials for public storefront
   */
  async getPublishedTutorials() {
    const res = await query(`
      SELECT 
        t.id,
        t.product_id,
        t.title,
        t.lesson_tag,
        t.description,
        t.thumbnail_url,
        t.video_url,
        t.video_file_path,
        t.pdf_file_path,
        t.sort_order,
        t.is_published,
        t.created_at,
        t.updated_at,
        p.name AS product_name,
        p.slug AS product_slug,
        p.sku AS product_sku
      FROM tutorials t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.is_published = TRUE
      ORDER BY t.sort_order ASC, t.created_at ASC
    `);

    return res.rows.map(tut => {
      let thumb = tut.thumbnail_url || '';
      if (thumb && !thumb.startsWith('/') && !thumb.startsWith('http')) {
        thumb = `/${thumb}`;
      }
      return {
        ...tut,
        thumbnail_url: thumb,
        is_published: !!tut.is_published
      };
    });
  }

  /**
   * Get single tutorial by ID
   */
  async getTutorialById(id) {
    const res = await query(`
      SELECT 
        t.*,
        p.name AS product_name,
        p.slug AS product_slug,
        p.sku AS product_sku
      FROM tutorials t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    const tut = res.rows[0];
    let thumb = tut.thumbnail_url || '';
    if (thumb && !thumb.startsWith('/') && !thumb.startsWith('http')) {
      thumb = `/${thumb}`;
    }
    return {
      ...tut,
      thumbnail_url: thumb,
      is_published: !!tut.is_published
    };
  }

  /**
   * Get all tutorials for Admin management
   */
  async getAllTutorialsAdmin() {
    const res = await query(`
      SELECT 
        t.*,
        p.name AS product_name,
        p.slug AS product_slug,
        p.sku AS product_sku
      FROM tutorials t
      LEFT JOIN products p ON t.product_id = p.id
      ORDER BY t.sort_order ASC, t.created_at ASC
    `);

    return res.rows.map(tut => {
      let thumb = tut.thumbnail_url || '';
      if (thumb && !thumb.startsWith('/') && !thumb.startsWith('http')) {
        thumb = `/${thumb}`;
      }
      return {
        ...tut,
        thumbnail_url: thumb,
        is_published: !!tut.is_published
      };
    });
  }

  /**
   * Helper: Fetch product info & documents to easily build a tutorial
   */
  async getProductTutorialData(productId) {
    const prodRes = await query(`
      SELECT id, name, slug, sku, tagline, description 
      FROM products 
      WHERE id = $1
    `, [productId]);

    if (prodRes.rows.length === 0) {
      throw new Error(`Product with ID '${productId}' not found.`);
    }

    const product = prodRes.rows[0];

    // Get product main image
    const imgRes = await query(`
      SELECT image_url FROM product_images 
      WHERE product_id = $1 
      ORDER BY is_main DESC, sort_order ASC 
      LIMIT 1
    `, [productId]);

    const mainImage = imgRes.rows.length > 0 ? imgRes.rows[0].image_url : '/assets/images/oxybott_logo.webp';

    // Get any existing documents or video links attached to product
    const docRes = await query(`
      SELECT id, document_title, document_type, file_path, video_url, mime_type, file_size
      FROM product_documents
      WHERE product_id = $1
      ORDER BY created_at ASC
    `, [productId]);

    const videoDocs = docRes.rows.filter(d => 
      Boolean(d.video_url) || 
      (d.mime_type && d.mime_type.startsWith('video/')) || 
      (d.file_path && /\.(mp4|webm|mov|mkv)$/i.test(d.file_path))
    );

    const pdfDocs = docRes.rows.filter(d => 
      d.file_path && d.file_path.endsWith('.pdf')
    );

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        tagline: product.tagline,
        main_image: mainImage.startsWith('/') || mainImage.startsWith('http') ? mainImage : `/${mainImage}`
      },
      suggested_title: `${product.name}: Step-by-Step Build & Programming Guide`,
      suggested_thumbnail: mainImage.startsWith('/') || mainImage.startsWith('http') ? mainImage : `/${mainImage}`,
      video_docs: videoDocs,
      pdf_docs: pdfDocs
    };
  }

  /**
   * Create new tutorial
   */
  async createTutorial(data) {
    const id = data.id || `tut-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const title = (data.title || '').trim();
    if (!title) {
      throw new Error('Tutorial title is required.');
    }

    const productId = data.product_id && data.product_id.trim() ? data.product_id.trim() : null;
    const lessonTag = (data.lesson_tag || data.lesson || 'Lesson 01 • 15 Mins').trim();
    const description = (data.description || data.desc || '').trim();
    let thumbnailUrl = (data.thumbnail_url || data.img || '').trim();
    const videoUrl = (data.video_url || '').trim();
    const videoFilePath = (data.video_file_path || '').trim();
    const pdfFilePath = (data.pdf_file_path || '').trim();
    const sortOrder = Number(data.sort_order || 0);
    const isPublished = data.is_published !== undefined ? (data.is_published === true || data.is_published === 'true' || data.is_published === 1) : true;

    // If no thumbnail provided and product_id exists, fallback to product image
    if (!thumbnailUrl && productId) {
      const imgRes = await query(
        'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY is_main DESC, sort_order ASC LIMIT 1',
        [productId]
      );
      if (imgRes.rows.length > 0) {
        thumbnailUrl = imgRes.rows[0].image_url;
      }
    }

    await query(`
      INSERT INTO tutorials (
        id, product_id, title, lesson_tag, description, thumbnail_url,
        video_url, video_file_path, pdf_file_path, sort_order, is_published,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      id,
      productId,
      title,
      lessonTag,
      description,
      thumbnailUrl,
      videoUrl,
      videoFilePath,
      pdfFilePath,
      sortOrder,
      isPublished ? 1 : 0
    ]);

    return this.getTutorialById(id);
  }

  /**
   * Update existing tutorial
   */
  async updateTutorial(id, data) {
    const existing = await this.getTutorialById(id);
    if (!existing) {
      throw new Error(`Tutorial with ID '${id}' not found.`);
    }

    const title = data.title !== undefined ? data.title.trim() : existing.title;
    if (!title) {
      throw new Error('Tutorial title cannot be empty.');
    }

    const productId = data.product_id !== undefined ? (data.product_id ? data.product_id.trim() : null) : existing.product_id;
    const lessonTag = data.lesson_tag !== undefined ? data.lesson_tag.trim() : existing.lesson_tag;
    const description = data.description !== undefined ? data.description.trim() : existing.description;
    const thumbnailUrl = data.thumbnail_url !== undefined ? data.thumbnail_url.trim() : existing.thumbnail_url;
    const videoUrl = data.video_url !== undefined ? data.video_url.trim() : existing.video_url;
    const videoFilePath = data.video_file_path !== undefined ? data.video_file_path.trim() : existing.video_file_path;
    const pdfFilePath = data.pdf_file_path !== undefined ? data.pdf_file_path.trim() : existing.pdf_file_path;
    const sortOrder = data.sort_order !== undefined ? Number(data.sort_order) : existing.sort_order;
    const isPublished = data.is_published !== undefined ? (data.is_published === true || data.is_published === 'true' || data.is_published === 1) : existing.is_published;

    await query(`
      UPDATE tutorials
      SET 
        product_id = $1,
        title = $2,
        lesson_tag = $3,
        description = $4,
        thumbnail_url = $5,
        video_url = $6,
        video_file_path = $7,
        pdf_file_path = $8,
        sort_order = $9,
        is_published = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [
      productId,
      title,
      lessonTag,
      description,
      thumbnailUrl,
      videoUrl,
      videoFilePath,
      pdfFilePath,
      sortOrder,
      isPublished ? 1 : 0,
      id
    ]);

    return this.getTutorialById(id);
  }

  /**
   * Delete tutorial
   */
  async deleteTutorial(id) {
    const existing = await this.getTutorialById(id);
    if (!existing) {
      throw new Error(`Tutorial with ID '${id}' not found.`);
    }

    // Clean up uploaded files if present
    if (existing.video_file_path && existing.video_file_path.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '../../', existing.video_file_path);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (e) { /* ignore */ }
      }
    }

    await query('DELETE FROM tutorials WHERE id = $1', [id]);
    return { success: true, id };
  }
}

module.exports = new TutorialsService();

