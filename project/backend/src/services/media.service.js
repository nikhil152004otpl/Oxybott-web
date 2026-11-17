const { query } = require('../config/db');
const path = require('path');
const fs = require('fs');

class MediaService {
  /**
   * Get media library list with search and filtering
   */
  async getMediaAssets({ type, search, page = 1, limit = 50 }) {
    let sql = 'SELECT * FROM media_assets WHERE 1=1';
    const params = [];

    if (type && type !== 'all') {
      params.push(type);
      sql += ` AND asset_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (file_name LIKE $${params.length} OR original_name LIKE $${params.length} OR alt_text LIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC';

    const offset = (page - 1) * limit;
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Upload and register a media asset
   */
  async registerMediaAsset(file, altText = '', assetType = 'image') {
    const id = 'med_' + Date.now();
    const relativePath = `/uploads/${assetType === 'document' ? 'documents' : (assetType === 'video' ? 'videos' : 'products')}/${file.filename}`;

    await query(`
      INSERT INTO media_assets (id, file_name, original_name, file_path, file_size, mime_type, asset_type, alt_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      id,
      file.filename,
      file.originalname,
      relativePath,
      file.size,
      file.mimetype,
      assetType,
      altText || file.originalname
    ]);

    return {
      id,
      file_name: file.filename,
      file_path: relativePath,
      asset_type: assetType
    };
  }

  /**
   * Check references and delete asset
   */
  async deleteMediaAsset(id) {
    const assetRes = await query('SELECT * FROM media_assets WHERE id = $1', [id]);
    if (assetRes.rows.length === 0) return { success: false, error: 'Asset not found.' };
    const asset = assetRes.rows[0];

    // Reference Check: product_images, tutorials, and page_sections
    const prodImgCheck = await query('SELECT id FROM product_images WHERE image_url LIKE $1', [`%${asset.file_name}%`]);
    if (prodImgCheck.rows.length > 0) {
      return { success: false, error: 'Cannot delete: Asset is currently linked as a product image.' };
    }

    const tutCheck = await query('SELECT id FROM tutorials WHERE thumbnail_url LIKE $1 OR video_url LIKE $1', [`%${asset.file_name}%`]);
    if (tutCheck.rows.length > 0) {
      return { success: false, error: 'Cannot delete: Asset is referenced in tutorials.' };
    }

    // Safe to delete from disk
    const diskPath = path.resolve(__dirname, '../../', asset.file_path.replace(/^\//, ''));
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) {}
    }

    await query('DELETE FROM media_assets WHERE id = $1', [id]);
    return { success: true };
  }
}

module.exports = new MediaService();

