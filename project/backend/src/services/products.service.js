const { query, transaction } = require('../config/db');

class ProductsService {
  /**
   * Get public products catalog with search, filter, sort and pagination
   */
  async getProducts(filters = {}) {
    const { category, series, search, sort, featured, limit, offset } = filters;

    let sql = `
      SELECT DISTINCT p.id, p.slug, p.sku, p.name, p.short_name, p.tagline, p.description,
             p.series, p.age, p.grade, p.price, p.sale_price, p.stock_quantity,
             p.badge, p.rating, p.reviews_count, p.sort_order, p.created_at, p.osemi_url,
             c.name AS category,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) AS main_image
      FROM products p
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.is_published = TRUE
    `;

    const params = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND (c.slug = $${paramIndex} OR c.name = $${paramIndex} OR p.series = $${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    if (series) {
      sql += ` AND LOWER(p.series) = LOWER($${paramIndex})`;
      params.push(series);
      paramIndex++;
    }

    if (featured === 'true' || featured === '1' || featured === true) {
      sql += ` AND p.is_featured = TRUE`;
    }

    if (search) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.short_name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (sort === 'price-asc') {
      sql += ` ORDER BY p.price ASC`;
    } else if (sort === 'price-desc') {
      sql += ` ORDER BY p.price DESC`;
    } else if (sort === 'rating') {
      sql += ` ORDER BY p.rating DESC, p.reviews_count DESC`;
    } else if (sort === 'newest') {
      sql += ` ORDER BY p.created_at DESC`;
    } else {
      sql += ` ORDER BY p.sort_order ASC, p.created_at DESC`;
    }

    if (limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(parseInt(limit, 10));
      if (offset) {
        sql += ` OFFSET $${paramIndex++}`;
        params.push(parseInt(offset, 10));
      }
    }

    const res = await query(sql, params);
    const products = res.rows;

    for (const p of products) {
      if (!p.main_image) {
        const anyImg = await query('SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC LIMIT 1', [p.id]);
        p.main_image = anyImg.rows.length > 0 ? anyImg.rows[0].image_url : '/assets/images/oxybott_logo.webp';
      }
      if (p.main_image && !p.main_image.startsWith('/') && !p.main_image.startsWith('http')) {
        p.main_image = `/${p.main_image}`;
      }
      p.price = Number(p.price);
      p.sale_price = p.sale_price ? Number(p.sale_price) : null;
      p.rating = Number(p.rating);
    }

    return products;
  }

  /**
   * Get single product detail by slug or ID with all relational metadata
   */
  async getProductBySlugOrId(slugOrId) {
    const prodRes = await query(
      'SELECT * FROM products WHERE (id = $1 OR slug = $1) AND is_published = TRUE',
      [slugOrId]
    );

    if (prodRes.rows.length === 0) return null;
    const product = prodRes.rows[0];

    // Images
    const imgRes = await query(
      'SELECT id, image_url, alt_text, is_main, sort_order FROM product_images WHERE product_id = $1 ORDER BY is_main DESC, sort_order ASC',
      [product.id]
    );

    // Specifications
    const specRes = await query(
      'SELECT spec_key, spec_value FROM product_specifications WHERE product_id = $1 ORDER BY sort_order ASC',
      [product.id]
    );
    const specs = {};
    specRes.rows.forEach(s => { specs[s.spec_key] = s.spec_value; });

    // Highlights
    const hlRes = await query(
      'SELECT highlight_text FROM product_highlights WHERE product_id = $1 ORDER BY sort_order ASC',
      [product.id]
    );
    const highlights = hlRes.rows.map(h => h.highlight_text);

    // Box Contents
    const boxRes = await query(
      'SELECT item_text FROM product_box_contents WHERE product_id = $1 ORDER BY sort_order ASC',
      [product.id]
    );
    const boxContents = boxRes.rows.map(b => b.item_text);

    // Categories
    const catRes = await query(`
      SELECT c.id, c.name, c.slug 
      FROM categories c 
      JOIN product_categories pc ON pc.category_id = c.id 
      WHERE pc.product_id = $1
    `, [product.id]);

    // Product Documents (Tutorials, Assembly Guides, Video Links & Files)
    const docRes = await query(
      `SELECT id, product_id, document_title, document_type, file_path, video_url, original_filename, file_size, mime_type, created_at, updated_at
       FROM product_documents
       WHERE product_id = $1
       ORDER BY created_at ASC`,
      [product.id]
    );

    return {
      ...product,
      price: Number(product.price),
      sale_price: product.sale_price ? Number(product.sale_price) : null,
      rating: Number(product.rating),
      images: imgRes.rows.map(img => ({
        ...img,
        image_url: img.image_url && !img.image_url.startsWith('/') && !img.image_url.startsWith('http') ? `/${img.image_url}` : img.image_url
      })),
      main_image: imgRes.rows.length > 0
        ? (imgRes.rows[0].image_url.startsWith('/') || imgRes.rows[0].image_url.startsWith('http') ? imgRes.rows[0].image_url : `/${imgRes.rows[0].image_url}`)
        : '/assets/images/oxybott_logo.webp',
      specs,
      highlights,
      boxContents,
      categories: catRes.rows,
      documents: docRes.rows
    };
  }

  /**
   * Admin Product Listing with pagination & counts
   */
  async adminGetProducts(filters = {}) {
    const { search, series, status, sort, page = 1, limit = 20 } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let pIdx = 1;

    if (search) {
      whereClause += ` AND (p.name ILIKE $${pIdx} OR p.sku ILIKE $${pIdx} OR p.short_name ILIKE $${pIdx})`;
      params.push(`%${search}%`);
      pIdx++;
    }

    if (series) {
      whereClause += ` AND p.series = $${pIdx}`;
      params.push(series);
      pIdx++;
    }

    if (status === 'published') {
      whereClause += ` AND p.is_published = TRUE`;
    } else if (status === 'draft') {
      whereClause += ` AND p.is_published = FALSE`;
    } else if (status === 'low_stock') {
      whereClause += ` AND p.stock_quantity <= p.low_stock_threshold`;
    }

    let orderClause = 'ORDER BY p.updated_at DESC';
    if (sort === 'price-asc') orderClause = 'ORDER BY p.price ASC';
    else if (sort === 'price-desc') orderClause = 'ORDER BY p.price DESC';
    else if (sort === 'stock-asc') orderClause = 'ORDER BY p.stock_quantity ASC';
    else if (sort === 'name-asc') orderClause = 'ORDER BY p.name ASC';

    const countRes = await query(`SELECT COUNT(*) as total FROM products p ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = TRUE LIMIT 1) AS main_image
      FROM products p
      ${whereClause}
      ${orderClause}
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;
    params.push(limitNum, offset);

    const dataRes = await query(dataSql, params);
    const products = dataRes.rows;

    for (const p of products) {
      if (!p.main_image) {
        const anyImg = await query('SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC LIMIT 1', [p.id]);
        p.main_image = anyImg.rows.length > 0 ? anyImg.rows[0].image_url : '/assets/images/oxybott_logo.webp';
      }
      if (p.main_image && !p.main_image.startsWith('/') && !p.main_image.startsWith('http')) {
        p.main_image = `/${p.main_image}`;
      }
      p.price = Number(p.price);
      p.sale_price = p.sale_price ? Number(p.sale_price) : null;
    }

    return {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      products
    };
  }

  /**
   * Admin Get Product by ID with all relations
   */
  async adminGetProductById(id) {
    const pRes = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (pRes.rows.length === 0) return null;
    const product = pRes.rows[0];

    const images = (await query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_main DESC, sort_order ASC', [id])).rows;
    const specs = (await query('SELECT spec_key, spec_value, sort_order FROM product_specifications WHERE product_id = $1 ORDER BY sort_order ASC', [id])).rows;
    const highlights = (await query('SELECT highlight_text, sort_order FROM product_highlights WHERE product_id = $1 ORDER BY sort_order ASC', [id])).rows;
    const boxContents = (await query('SELECT item_text, sort_order FROM product_box_contents WHERE product_id = $1 ORDER BY sort_order ASC', [id])).rows;
    const categoryIds = (await query('SELECT category_id FROM product_categories WHERE product_id = $1', [id])).rows.map(c => c.category_id);
    const documents = (await query('SELECT * FROM product_documents WHERE product_id = $1 ORDER BY created_at ASC', [id])).rows;

    return {
      ...product,
      price: Number(product.price),
      sale_price: product.sale_price ? Number(product.sale_price) : null,
      images,
      specs,
      highlights,
      boxContents,
      categoryIds,
      documents
    };
  }

  /**
   * Create Product with relational specifications, highlights, box contents, and categories
   */
  async createProduct(data) {
    return transaction(async (client) => {
      const {
        name, short_name, sku, price, sale_price, stock_quantity,
        series, age, grade, tagline, description, badge, is_published,
        is_featured, specs, highlights, boxContents, categoryIds,
        osemi_url, osemiUrl
      } = data;

      // Validate OSEMI URL
      const rawOsemi = (osemi_url !== undefined ? osemi_url : osemiUrl) || '';
      let cleanOsemiUrl = rawOsemi.trim();
      if (cleanOsemiUrl) {
        if (!cleanOsemiUrl.startsWith('https://')) {
          throw new Error('OSEMI Product URL must be a valid HTTPS link (starting with https://).');
        }
      } else {
        cleanOsemiUrl = null;
      }

      // Uniqueness check for SKU
      const skuCheck = await client.query('SELECT id FROM products WHERE sku = $1', [sku.trim()]);
      if (skuCheck.rows.length > 0) {
        throw new Error(`SKU '${sku}' is already in use by another product.`);
      }

      // Unique ID & slug generation
      let productId = data.id ? data.id.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-') : null;
      const baseSlug = (data.slug || (productId || name)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let slug = baseSlug;
      let counter = 1;
      while ((await client.query('SELECT id FROM products WHERE slug = $1 AND id != $2', [slug, productId || ''])).rows.length > 0) {
        slug = `${baseSlug}-${counter++}`;
      }
      if (!productId) productId = slug;

      const numPrice = parseFloat(price);
      const numSalePrice = sale_price ? parseFloat(sale_price) : null;
      const numStock = parseInt(stock_quantity !== undefined ? stock_quantity : 100, 10);

      await client.query(`
        INSERT INTO products (
          id, slug, sku, name, short_name, tagline, description, series,
          age, grade, price, sale_price, stock_quantity, is_published, is_featured,
          badge, rating, reviews_count, osemi_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, 5.0, 0, $17
        )
      `, [
        productId, slug, sku.trim(), name.trim(),
        short_name ? short_name.trim() : name.trim(),
        tagline || '', description || '', series || 'Explorer Series',
        age || '8+', grade || 'Grade 3-8', numPrice, numSalePrice, numStock,
        is_published ? true : false, is_featured ? true : false, badge || 'New',
        cleanOsemiUrl
      ]);

      // Specifications
      if (specs) {
        if (Array.isArray(specs)) {
          for (let i = 0; i < specs.length; i++) {
            const s = specs[i];
            if (s.key && s.value) {
              await client.query('INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES ($1, $2, $3, $4)', [productId, s.key.trim(), s.value.trim(), i]);
            }
          }
        } else if (typeof specs === 'object') {
          let i = 0;
          for (const [k, v] of Object.entries(specs)) {
            if (k && v) {
              await client.query('INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES ($1, $2, $3, $4)', [productId, String(k).trim(), String(v).trim(), i++]);
            }
          }
        }
      }

      // Highlights
      const hlList = highlights || data.highlight_list;
      if (hlList && Array.isArray(hlList)) {
        for (let i = 0; i < hlList.length; i++) {
          const h = hlList[i];
          if (h && String(h).trim()) {
            await client.query('INSERT INTO product_highlights (product_id, highlight_text, sort_order) VALUES ($1, $2, $3)', [productId, String(h).trim(), i]);
          }
        }
      }

      // Box Contents
      const boxList = boxContents || data.box_contents;
      if (boxList && Array.isArray(boxList)) {
        for (let i = 0; i < boxList.length; i++) {
          const b = boxList[i];
          if (b && String(b).trim()) {
            await client.query('INSERT INTO product_box_contents (product_id, item_text, sort_order) VALUES ($1, $2, $3)', [productId, String(b).trim(), i]);
          }
        }
      }

      // Categories
      if (categoryIds && Array.isArray(categoryIds)) {
        for (const cId of categoryIds) {
          await client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [productId, parseInt(cId, 10)]);
        }
      }

      return { productId, slug };
    });
  }

  /**
   * Update Product
   */
  async updateProduct(id, data) {
    return transaction(async (client) => {
      const existingRes = await client.query('SELECT * FROM products WHERE id = $1', [id]);
      if (existingRes.rows.length === 0) throw new Error('Product not found.');
      const existing = existingRes.rows[0];

      const {
        name, short_name, sku, price, sale_price, stock_quantity,
        series, age, grade, tagline, description, badge, is_published,
        is_featured, specs, highlights, boxContents, categoryIds,
        osemi_url, osemiUrl
      } = data;

      if (sku && sku.trim() !== existing.sku) {
        const colRes = await client.query('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku.trim(), id]);
        if (colRes.rows.length > 0) throw new Error(`SKU '${sku}' is already in use by another product.`);
      }

      // Handle OSEMI URL update
      const rawOsemi = osemi_url !== undefined ? osemi_url : osemiUrl;
      let cleanOsemiUrl = existing.osemi_url;
      if (rawOsemi !== undefined) {
        const trimmed = String(rawOsemi || '').trim();
        if (trimmed) {
          if (!trimmed.startsWith('https://')) {
            throw new Error('OSEMI Product URL must be a valid HTTPS link (starting with https://).');
          }
          cleanOsemiUrl = trimmed;
        } else {
          cleanOsemiUrl = null;
        }
      }

      const numPrice = parseFloat(price);
      const numSalePrice = sale_price ? parseFloat(sale_price) : null;
      const numStock = parseInt(stock_quantity !== undefined ? stock_quantity : existing.stock_quantity, 10);

      await client.query(`
        UPDATE products SET
          name = $1, short_name = $2, sku = $3, price = $4, sale_price = $5,
          stock_quantity = $6, series = $7, age = $8, grade = $9, tagline = $10,
          description = $11, badge = $12, is_published = $13, is_featured = $14,
          osemi_url = $15, updated_at = CURRENT_TIMESTAMP
        WHERE id = $16
      `, [
        name !== undefined ? name.trim() : existing.name,
        short_name !== undefined ? short_name.trim() : existing.short_name,
        sku !== undefined ? sku.trim() : existing.sku,
        !isNaN(numPrice) ? numPrice : existing.price,
        numSalePrice,
        numStock,
        series || existing.series,
        age || existing.age,
        grade || existing.grade,
        tagline !== undefined ? tagline : existing.tagline,
        description !== undefined ? description : existing.description,
        badge !== undefined ? badge : existing.badge,
        is_published !== undefined ? !!is_published : existing.is_published,
        is_featured !== undefined ? !!is_featured : existing.is_featured,
        cleanOsemiUrl,
        id
      ]);

      if (specs && Array.isArray(specs)) {
        await client.query('DELETE FROM product_specifications WHERE product_id = $1', [id]);
        for (let i = 0; i < specs.length; i++) {
          const s = specs[i];
          if (s.key && s.value) {
            await client.query('INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES ($1, $2, $3, $4)', [id, s.key.trim(), s.value.trim(), i]);
          }
        }
      }

      if (highlights && Array.isArray(highlights)) {
        await client.query('DELETE FROM product_highlights WHERE product_id = $1', [id]);
        for (let i = 0; i < highlights.length; i++) {
          const h = highlights[i];
          if (h && String(h).trim()) {
            await client.query('INSERT INTO product_highlights (product_id, highlight_text, sort_order) VALUES ($1, $2, $3)', [id, String(h).trim(), i]);
          }
        }
      }

      if (boxContents && Array.isArray(boxContents)) {
        await client.query('DELETE FROM product_box_contents WHERE product_id = $1', [id]);
        for (let i = 0; i < boxContents.length; i++) {
          const b = boxContents[i];
          if (b && String(b).trim()) {
            await client.query('INSERT INTO product_box_contents (product_id, item_text, sort_order) VALUES ($1, $2, $3)', [id, String(b).trim(), i]);
          }
        }
      }

      if (categoryIds && Array.isArray(categoryIds)) {
        await client.query('DELETE FROM product_categories WHERE product_id = $1', [id]);
        for (const cId of categoryIds) {
          await client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, parseInt(cId, 10)]);
        }
      }
    });
  }

  /**
   * Toggle publish state
   */
  async togglePublish(id, isPublished) {
    const val = !!isPublished;
    await query('UPDATE products SET is_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [val, id]);
    return val;
  }

  /**
   * Duplicate product
   */
  async duplicateProduct(id) {
    return transaction(async (client) => {
      const origRes = await client.query('SELECT * FROM products WHERE id = $1', [id]);
      if (origRes.rows.length === 0) throw new Error('Original product not found.');
      const orig = origRes.rows[0];

      const newName = `${orig.name} (Copy)`;
      const newSku = `${orig.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`;
      const baseSlug = `${orig.slug}-copy`;
      let newSlug = baseSlug;
      let count = 1;
      while ((await client.query('SELECT id FROM products WHERE slug = $1', [newSlug])).rows.length > 0) {
        newSlug = `${baseSlug}-${count++}`;
      }
      const newId = newSlug;

      await client.query(`
        INSERT INTO products (
          id, slug, sku, name, short_name, tagline, description, series,
          age, grade, price, sale_price, stock_quantity, is_published, is_featured,
          badge, rating, reviews_count, osemi_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, FALSE, FALSE,
          $14, $15, 0, $16
        )
      `, [
        newId, newSlug, newSku, newName, `${orig.short_name} (Copy)`,
        orig.tagline, orig.description, orig.series, orig.age, orig.grade,
        orig.price, orig.sale_price, orig.stock_quantity, 'Draft', orig.rating,
        orig.osemi_url || null
      ]);

      // Copy images
      const images = (await client.query('SELECT * FROM product_images WHERE product_id = $1', [id])).rows;
      for (const img of images) {
        await client.query('INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_main) VALUES ($1, $2, $3, $4, $5)', [newId, img.image_url, img.alt_text, img.sort_order, img.is_main]);
      }

      // Copy specs
      const specs = (await client.query('SELECT * FROM product_specifications WHERE product_id = $1', [id])).rows;
      for (const s of specs) {
        await client.query('INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES ($1, $2, $3, $4)', [newId, s.spec_key, s.spec_value, s.sort_order]);
      }

      // Copy highlights
      const hls = (await client.query('SELECT * FROM product_highlights WHERE product_id = $1', [id])).rows;
      for (const h of hls) {
        await client.query('INSERT INTO product_highlights (product_id, highlight_text, sort_order) VALUES ($1, $2, $3)', [newId, h.highlight_text, h.sort_order]);
      }

      // Copy box contents
      const boxes = (await client.query('SELECT * FROM product_box_contents WHERE product_id = $1', [id])).rows;
      for (const b of boxes) {
        await client.query('INSERT INTO product_box_contents (product_id, item_text, sort_order) VALUES ($1, $2, $3)', [newId, b.item_text, b.sort_order]);
      }

      // Copy categories
      const cats = (await client.query('SELECT * FROM product_categories WHERE product_id = $1', [id])).rows;
      for (const c of cats) {
        await client.query('INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)', [newId, c.category_id]);
      }

      return newId;
    });
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    const res = await query('SELECT name, sku FROM products WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    await query('DELETE FROM products WHERE id = $1', [id]);
    return res.rows[0];
  }
}

module.exports = new ProductsService();

