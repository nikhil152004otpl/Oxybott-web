const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { query, transaction } = require('../config/db');
require('dotenv').config();

async function importFromSqlite() {
  console.log('=== Oxybott SQLite to PostgreSQL Data Migration ===');
  
  const sqlitePath = path.resolve(process.env.SQLITE_DB_PATH || '../../data/oxybott.db');
  if (!fs.existsSync(sqlitePath)) {
    console.error(`❌ SQLite database not found at ${sqlitePath}`);
    return;
  }

  console.log(`📖 Reading source SQLite database: ${sqlitePath}`);
  const sqlite = new DatabaseSync(sqlitePath);

  await transaction(async (client) => {
    // 1. Admin Users
    const adminRows = sqlite.prepare('SELECT * FROM admin_users').all();
    console.log(`Importing ${adminRows.length} admin user(s)...`);
    for (const u of adminRows) {
      await client.query(`
        INSERT INTO admin_users (id, username, email, password_hash, role, created_at, updated_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          updated_at = EXCLUDED.updated_at
      `, [u.id, u.username, u.email, u.password_hash, u.role, u.created_at, u.updated_at, u.last_login_at]);
    }
    // Update serial sequence
    await client.query(`SELECT setval(pg_get_serial_sequence('admin_users', 'id'), COALESCE(MAX(id), 1)) FROM admin_users`);

    // 2. Categories
    const catRows = sqlite.prepare('SELECT * FROM categories').all();
    console.log(`Importing ${catRows.length} categories...`);
    for (const c of catRows) {
      await client.query(`
        INSERT INTO categories (id, name, slug, description, image_url, sort_order, is_published, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          sort_order = EXCLUDED.sort_order,
          is_published = EXCLUDED.is_published,
          updated_at = EXCLUDED.updated_at
      `, [c.id, c.name, c.slug, c.description, c.image_url, c.sort_order, !!c.is_published, c.created_at, c.updated_at]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 1)) FROM categories`);

    // 3. Products
    const prodRows = sqlite.prepare('SELECT * FROM products').all();
    console.log(`Importing ${prodRows.length} products...`);
    for (const p of prodRows) {
      await client.query(`
        INSERT INTO products (
          id, slug, sku, name, short_name, tagline, description, series,
          age, grade, price, sale_price, stock_quantity, low_stock_threshold,
          is_published, is_featured, badge, rating, reviews_count, sort_order,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          sku = EXCLUDED.sku,
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          tagline = EXCLUDED.tagline,
          description = EXCLUDED.description,
          series = EXCLUDED.series,
          age = EXCLUDED.age,
          grade = EXCLUDED.grade,
          price = EXCLUDED.price,
          sale_price = EXCLUDED.sale_price,
          stock_quantity = EXCLUDED.stock_quantity,
          low_stock_threshold = EXCLUDED.low_stock_threshold,
          is_published = EXCLUDED.is_published,
          is_featured = EXCLUDED.is_featured,
          badge = EXCLUDED.badge,
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          sort_order = EXCLUDED.sort_order,
          updated_at = EXCLUDED.updated_at
      `, [
        p.id, p.slug, p.sku, p.name, p.short_name, p.tagline, p.description, p.series,
        p.age, p.grade, p.price, p.sale_price, p.stock_quantity, p.low_stock_threshold,
        !!p.is_published, !!p.is_featured, p.badge, p.rating, p.reviews_count, p.sort_order,
        p.created_at, p.updated_at
      ]);
    }

    // 4. Product Categories
    const pcRows = sqlite.prepare('SELECT * FROM product_categories').all();
    console.log(`Importing ${pcRows.length} product-category links...`);
    for (const pc of pcRows) {
      await client.query(`
        INSERT INTO product_categories (product_id, category_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [pc.product_id, pc.category_id]);
    }

    // 5. Product Images
    const imgRows = sqlite.prepare('SELECT * FROM product_images').all();
    console.log(`Importing ${imgRows.length} product images...`);
    for (const img of imgRows) {
      await client.query(`
        INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order, is_main, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [img.id, img.product_id, img.image_url, img.alt_text, img.sort_order, !!img.is_main, img.created_at]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('product_images', 'id'), COALESCE(MAX(id), 1)) FROM product_images`);

    // 6. Product Specifications
    const specRows = sqlite.prepare('SELECT * FROM product_specifications').all();
    console.log(`Importing ${specRows.length} product specs...`);
    for (const s of specRows) {
      await client.query(`
        INSERT INTO product_specifications (id, product_id, spec_key, spec_value, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [s.id, s.product_id, s.spec_key, s.spec_value, s.sort_order]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('product_specifications', 'id'), COALESCE(MAX(id), 1)) FROM product_specifications`);

    // 7. Product Highlights
    const hlRows = sqlite.prepare('SELECT * FROM product_highlights').all();
    console.log(`Importing ${hlRows.length} product highlights...`);
    for (const h of hlRows) {
      await client.query(`
        INSERT INTO product_highlights (id, product_id, highlight_text, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [h.id, h.product_id, h.highlight_text, h.sort_order]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('product_highlights', 'id'), COALESCE(MAX(id), 1)) FROM product_highlights`);

    // 8. Product Box Contents
    const boxRows = sqlite.prepare('SELECT * FROM product_box_contents').all();
    console.log(`Importing ${boxRows.length} box items...`);
    for (const b of boxRows) {
      await client.query(`
        INSERT INTO product_box_contents (id, product_id, item_text, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [b.id, b.product_id, b.item_text, b.sort_order]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('product_box_contents', 'id'), COALESCE(MAX(id), 1)) FROM product_box_contents`);

    // 9. Banners
    const bannerRows = sqlite.prepare('SELECT * FROM banners').all();
    console.log(`Importing ${bannerRows.length} banners...`);
    for (const bn of bannerRows) {
      await client.query(`
        INSERT INTO banners (id, title, subtitle, image_url, cta_text, cta_link, is_active, sort_order, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [bn.id, bn.title, bn.subtitle, bn.image_url, bn.cta_text, bn.cta_link, !!bn.is_active, bn.sort_order, bn.created_at]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('banners', 'id'), COALESCE(MAX(id), 1)) FROM banners`);

    // 10. Site Settings
    const settingRows = sqlite.prepare('SELECT * FROM site_settings').all();
    console.log(`Importing ${settingRows.length} site settings...`);
    for (const st of settingRows) {
      await client.query(`
        INSERT INTO site_settings (setting_key, setting_value, updated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_at = EXCLUDED.updated_at
      `, [st.setting_key, st.setting_value, st.updated_at]);
    }

    // 11. Audit Logs
    const auditRows = sqlite.prepare('SELECT * FROM audit_logs').all();
    console.log(`Importing ${auditRows.length} audit logs...`);
    for (const al of auditRows) {
      await client.query(`
        INSERT INTO audit_logs (id, user_id, username, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [al.id, al.user_id, al.username, al.action, al.entity_type, al.entity_id, al.details, al.ip_address, al.created_at]);
    }
    await client.query(`SELECT setval(pg_get_serial_sequence('audit_logs', 'id'), COALESCE(MAX(id), 1)) FROM audit_logs`);

    // 12. Product Documents & Tutorials
    try {
      const docRows = sqlite.prepare('SELECT * FROM product_documents').all();
      console.log(`Importing ${docRows.length} product documents...`);
      for (const d of docRows) {
        await client.query(`
          INSERT INTO product_documents (id, product_id, document_title, document_type, file_path, video_url, original_filename, file_size, mime_type, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            document_title = EXCLUDED.document_title,
            document_type = EXCLUDED.document_type,
            file_path = EXCLUDED.file_path,
            video_url = EXCLUDED.video_url,
            original_filename = EXCLUDED.original_filename,
            file_size = EXCLUDED.file_size,
            mime_type = EXCLUDED.mime_type,
            updated_at = EXCLUDED.updated_at
        `, [d.id, d.product_id, d.document_title, d.document_type, d.file_path || '', d.video_url || null, d.original_filename || '', d.file_size || 0, d.mime_type || 'application/pdf', d.created_at, d.updated_at]);
      }
    } catch (e) {
      console.log('No existing product_documents table in SQLite to import or error:', e.message);
    }

    // 13. Tutorials & Guides
    try {
      const tutRows = sqlite.prepare('SELECT * FROM tutorials').all();
      console.log(`Importing ${tutRows.length} tutorials...`);
      for (const t of tutRows) {
        await client.query(`
          INSERT INTO tutorials (id, product_id, title, lesson_tag, description, thumbnail_url, video_url, video_file_path, pdf_file_path, sort_order, is_published, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            product_id = EXCLUDED.product_id,
            title = EXCLUDED.title,
            lesson_tag = EXCLUDED.lesson_tag,
            description = EXCLUDED.description,
            thumbnail_url = EXCLUDED.thumbnail_url,
            video_url = EXCLUDED.video_url,
            video_file_path = EXCLUDED.video_file_path,
            pdf_file_path = EXCLUDED.pdf_file_path,
            sort_order = EXCLUDED.sort_order,
            is_published = EXCLUDED.is_published,
            updated_at = EXCLUDED.updated_at
        `, [t.id, t.product_id || null, t.title, t.lesson_tag, t.description, t.thumbnail_url, t.video_url, t.video_file_path, t.pdf_file_path, t.sort_order, !!t.is_published, t.created_at, t.updated_at]);
      }
    } catch (e) {
      console.log('No existing tutorials table in SQLite to import or error:', e.message);
    }

    // 14. Inquiries (if exists in SQLite)
    try {
      const inqRows = sqlite.prepare('SELECT * FROM inquiries').all();
      console.log(`Importing ${inqRows.length} inquiries...`);
      for (const inq of inqRows) {
        await client.query(`
          INSERT INTO inquiries (id, type, name, email, organization, phone, subject, message, details, status, ip_address, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING
        `, [inq.id, inq.type, inq.name, inq.email, inq.organization, inq.phone, inq.subject, inq.message, inq.details, inq.status, inq.ip_address, inq.created_at, inq.updated_at]);
      }
    } catch (e) {
      console.log('No existing inquiries table in SQLite to import.');
    }
  });

  console.log('✅ SQLite data import to PostgreSQL completed successfully!');
}

if (require.main === module) {
  importFromSqlite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Import error:', err);
      process.exit(1);
    });
}

module.exports = importFromSqlite;

