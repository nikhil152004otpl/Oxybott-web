const { query } = require('../config/db');
const { calculateSha256 } = require('../middleware/softwareUpload');
const path = require('path');
const fs = require('fs');

class SoftwareService {
  /**
   * Get all published software items with latest releases
   */
  async getSoftwareCatalog() {
    const itemsRes = await query(
      'SELECT * FROM software_items WHERE is_published = TRUE ORDER BY sort_order ASC, created_at ASC'
    );
    const items = itemsRes.rows;

    for (const item of items) {
      try {
        item.supported_os = typeof item.supported_os === 'string' ? JSON.parse(item.supported_os) : item.supported_os;
      } catch (e) {
        item.supported_os = [];
      }

      const relRes = await query(
        'SELECT * FROM software_releases WHERE software_id = $1 AND is_published = TRUE ORDER BY is_latest DESC, created_at DESC',
        [item.id]
      );
      item.releases = relRes.rows;
    }

    return items;
  }

  /**
   * Admin get all software items
   */
  async getAllSoftwareAdmin() {
    const itemsRes = await query('SELECT * FROM software_items ORDER BY sort_order ASC, created_at ASC');
    const items = itemsRes.rows;

    for (const item of items) {
      try {
        item.supported_os = typeof item.supported_os === 'string' ? JSON.parse(item.supported_os) : item.supported_os;
      } catch (e) {
        item.supported_os = [];
      }

      const relRes = await query(
        'SELECT * FROM software_releases WHERE software_id = $1 ORDER BY created_at DESC',
        [item.id]
      );
      item.releases = relRes.rows;
    }

    return items;
  }

  /**
   * Create software item
   */
  async createSoftwareItem(data) {
    const id = 'soft_' + (data.slug || Date.now());
    const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const supportedOsStr = typeof data.supported_os === 'object' ? JSON.stringify(data.supported_os) : (data.supported_os || '[]');

    await query(`
      INSERT INTO software_items (
        id, name, slug, icon, short_desc, description, supported_os,
        primary_btn_text, primary_btn_action, secondary_btn_text, secondary_btn_action,
        sort_order, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      id,
      data.name,
      slug,
      data.icon || 'Code',
      data.short_desc || '',
      data.description || '',
      supportedOsStr,
      data.primary_btn_text || 'Download',
      data.primary_btn_action || '',
      data.secondary_btn_text || '',
      data.secondary_btn_action || '',
      data.sort_order || 0,
      data.is_published !== undefined ? data.is_published : true
    ]);

    return id;
  }

  /**
   * Update software item
   */
  async updateSoftwareItem(id, data) {
    const supportedOsStr = data.supported_os !== undefined
      ? (typeof data.supported_os === 'object' ? JSON.stringify(data.supported_os) : data.supported_os)
      : undefined;

    await query(`
      UPDATE software_items
      SET name = COALESCE($1, name),
          icon = COALESCE($2, icon),
          short_desc = COALESCE($3, short_desc),
          description = COALESCE($4, description),
          supported_os = COALESCE($5, supported_os),
          primary_btn_text = COALESCE($6, primary_btn_text),
          primary_btn_action = COALESCE($7, primary_btn_action),
          secondary_btn_text = COALESCE($8, secondary_btn_text),
          secondary_btn_action = COALESCE($9, secondary_btn_action),
          sort_order = COALESCE($10, sort_order),
          is_published = COALESCE($11, is_published),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `, [
      data.name,
      data.icon,
      data.short_desc,
      data.description,
      supportedOsStr,
      data.primary_btn_text,
      data.primary_btn_action,
      data.secondary_btn_text,
      data.secondary_btn_action,
      data.sort_order,
      data.is_published,
      id
    ]);
  }

  /**
   * Delete software item
   */
  async deleteSoftwareItem(id) {
    // Delete files associated with its releases
    const releasesRes = await query('SELECT file_path FROM software_releases WHERE software_id = $1', [id]);
    for (const r of releasesRes.rows) {
      if (r.file_path && fs.existsSync(r.file_path)) {
        try { fs.unlinkSync(r.file_path); } catch (e) {}
      }
    }
    await query('DELETE FROM software_items WHERE id = $1', [id]);
  }

  /**
   * Add Release to Software
   */
  async addRelease(softwareId, releaseData, file) {
    const id = 'rel_' + Date.now();
    let filePath = '';
    let fileName = '';
    let fileSize = 0;
    let fileType = '';
    let sha256 = '';

    if (file) {
      filePath = file.path;
      fileName = file.originalname;
      fileSize = file.size;
      fileType = path.extname(file.originalname).toLowerCase();
      sha256 = await calculateSha256(file.path);
    }

    // If new release is set as latest, unmark previous latest
    if (releaseData.is_latest) {
      await query('UPDATE software_releases SET is_latest = FALSE WHERE software_id = $1 AND platform = $2', [softwareId, releaseData.platform]);
    }

    await query(`
      INSERT INTO software_releases (
        id, software_id, version, platform, architecture, release_notes,
        file_name, file_path, file_size, file_type, external_url, sha256_checksum,
        is_latest, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      id,
      softwareId,
      releaseData.version || '1.0.0',
      releaseData.platform || 'windows',
      releaseData.architecture || 'x64',
      releaseData.release_notes || '',
      fileName || releaseData.file_name || '',
      filePath || releaseData.file_path || '',
      fileSize || releaseData.file_size || 0,
      fileType || releaseData.file_type || '',
      releaseData.external_url || '',
      sha256 || releaseData.sha256_checksum || '',
      releaseData.is_latest !== undefined ? releaseData.is_latest : true,
      releaseData.is_published !== undefined ? releaseData.is_published : true
    ]);

    return id;
  }

  /**
   * Delete Release
   */
  async deleteRelease(releaseId) {
    const relRes = await query('SELECT file_path FROM software_releases WHERE id = $1', [releaseId]);
    if (relRes.rows.length > 0 && relRes.rows[0].file_path) {
      if (fs.existsSync(relRes.rows[0].file_path)) {
        try { fs.unlinkSync(relRes.rows[0].file_path); } catch (e) {}
      }
    }
    await query('DELETE FROM software_releases WHERE id = $1', [releaseId]);
  }

  /**
   * Get release for streaming download (increments counter)
   */
  async getReleaseForDownload(releaseId) {
    const relRes = await query('SELECT * FROM software_releases WHERE id = $1', [releaseId]);
    if (relRes.rows.length === 0) return null;
    const release = relRes.rows[0];

    // Increment download counter
    await query('UPDATE software_releases SET download_count = download_count + 1 WHERE id = $1', [releaseId]);

    return release;
  }
}

module.exports = new SoftwareService();

