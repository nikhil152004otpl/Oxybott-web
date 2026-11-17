const { query } = require('../config/db');
const path = require('path');
const fs = require('fs');

class DocumentsService {
  /**
   * Get all documents associated with a product
   */
  async getDocumentsByProduct(productId) {
    const res = await query(
      `SELECT id, product_id, document_title, document_type, file_path, original_filename, file_size, mime_type, video_url, created_at, updated_at
       FROM product_documents
       WHERE product_id = $1
       ORDER BY created_at ASC`,
      [productId]
    );
    return res.rows;
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(documentId) {
    const res = await query(
      `SELECT * FROM product_documents WHERE id = $1`,
      [documentId]
    );
    return res.rows[0] || null;
  }

  /**
   * Create a new product document or video record
   */
  async createDocument(productId, file, data = {}) {
    const rawVideoUrl = (data.video_url || data.videoUrl || '').trim();

    if (!file && !rawVideoUrl) {
      throw new Error('A PDF document, video file, or video link (e.g. YouTube) is required.');
    }

    // Verify target product exists
    const prodRes = await query('SELECT id, name FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new Error(`Product with ID '${productId}' not found.`);
    }

    const docId = `doc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    let title = '';
    let type = (data.document_type || data.type || 'tutorial').trim().toLowerCase();
    let relativePath = '';
    let originalFilename = '';
    let fileSize = 0;
    let mimeType = 'application/pdf';
    let videoUrl = null;

    if (rawVideoUrl) {
      if (!/^https?:\/\//i.test(rawVideoUrl)) {
        throw new Error('Video URL must be a valid link starting with http:// or https://');
      }
      const isYouTube = /youtu(\.be|be\.com)/i.test(rawVideoUrl);
      videoUrl = rawVideoUrl;
      mimeType = isYouTube ? 'video/youtube' : 'video/url';
      if (!data.document_type || data.document_type === 'tutorial') {
        type = 'video_tutorial';
      }
      title = (data.document_title || data.title || (isYouTube ? 'YouTube Tutorial Video' : 'Tutorial Video')).trim();
      originalFilename = isYouTube ? 'YouTube Video' : 'Video Link';
      fileSize = 0;
      relativePath = '';
    } else if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      const isVideo = ['.mp4', '.webm', '.mov', '.mkv'].includes(ext);
      const folder = isVideo ? 'videos' : 'documents';

      relativePath = `/uploads/${folder}/${file.filename}`;
      originalFilename = file.originalname;
      fileSize = file.size;
      mimeType = file.mimetype || (isVideo ? 'video/mp4' : 'application/pdf');
      videoUrl = isVideo ? relativePath : null;

      if (isVideo && (!data.document_type || data.document_type === 'tutorial')) {
        type = 'video_tutorial';
      }
      title = (data.document_title || data.title || path.basename(file.originalname, ext)).trim();
    }

    await query(
      `INSERT INTO product_documents (
        id, product_id, document_title, document_type, file_path,
        original_filename, file_size, mime_type, video_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        docId,
        productId,
        title,
        type,
        relativePath,
        originalFilename,
        fileSize,
        mimeType,
        videoUrl
      ]
    );

    return {
      id: docId,
      product_id: productId,
      document_title: title,
      document_type: type,
      file_path: relativePath,
      original_filename: originalFilename,
      file_size: fileSize,
      mime_type: mimeType,
      video_url: videoUrl
    };
  }

  /**
   * Replace or update an existing document or video
   */
  async replaceDocument(documentId, file, data = {}) {
    const doc = await this.getDocumentById(documentId);
    if (!doc) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new Error(`Document '${documentId}' not found.`);
    }

    let filePath = doc.file_path;
    let originalFilename = doc.original_filename;
    let fileSize = doc.file_size;
    let mimeType = doc.mime_type;
    let videoUrl = doc.video_url;

    const rawVideoUrl = (data.video_url || data.videoUrl || '').trim();

    // If a new physical file was uploaded to replace the old one
    if (file) {
      // Remove old file if it exists on disk
      if (doc.file_path && doc.file_path.startsWith('/uploads/')) {
        try {
          const oldDiskPath = path.resolve(__dirname, '../../', doc.file_path.replace(/^\//, ''));
          if (fs.existsSync(oldDiskPath)) {
            fs.unlinkSync(oldDiskPath);
          }
        } catch (err) {
          console.warn('[Doc Replacement Warning] Could not remove old document file:', err.message);
        }
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const isVideo = ['.mp4', '.webm', '.mov', '.mkv'].includes(ext);
      const folder = isVideo ? 'videos' : 'documents';

      filePath = `/uploads/${folder}/${file.filename}`;
      originalFilename = file.originalname;
      fileSize = file.size;
      mimeType = file.mimetype || (isVideo ? 'video/mp4' : 'application/pdf');
      videoUrl = isVideo ? filePath : null;
    } else if (rawVideoUrl) {
      if (!/^https?:\/\//i.test(rawVideoUrl)) {
        throw new Error('Video URL must be a valid link starting with http:// or https://');
      }
      // If switching to video link, delete old physical file
      if (doc.file_path && doc.file_path.startsWith('/uploads/')) {
        try {
          const oldDiskPath = path.resolve(__dirname, '../../', doc.file_path.replace(/^\//, ''));
          if (fs.existsSync(oldDiskPath)) fs.unlinkSync(oldDiskPath);
        } catch (e) {}
      }
      const isYouTube = /youtu(\.be|be\.com)/i.test(rawVideoUrl);
      videoUrl = rawVideoUrl;
      mimeType = isYouTube ? 'video/youtube' : 'video/url';
      filePath = '';
      originalFilename = isYouTube ? 'YouTube Video' : 'Video Link';
      fileSize = 0;
    }

    const title = data.document_title ? data.document_title.trim() : doc.document_title;
    const type = data.document_type ? data.document_type.trim().toLowerCase() : doc.document_type;

    await query(
      `UPDATE product_documents
       SET document_title = $1, document_type = $2, file_path = $3,
           original_filename = $4, file_size = $5, mime_type = $6, video_url = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [title, type, filePath, originalFilename, fileSize, mimeType, videoUrl, documentId]
    );

    return {
      id: documentId,
      product_id: doc.product_id,
      document_title: title,
      document_type: type,
      file_path: filePath,
      original_filename: originalFilename,
      file_size: fileSize,
      mime_type: mimeType,
      video_url: videoUrl
    };
  }

  /**
   * Delete document or video record and remove physical file
   */
  async deleteDocument(documentId) {
    const doc = await this.getDocumentById(documentId);
    if (!doc) throw new Error('Document not found.');

    // Unlink physical file from disk if it was an uploaded file
    if (doc.file_path && doc.file_path.startsWith('/uploads/')) {
      try {
        const diskPath = path.resolve(__dirname, '../../', doc.file_path.replace(/^\//, ''));
        if (fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
      } catch (err) {
        console.warn('[Doc Deletion Warning] Failed to delete file from disk:', err.message);
      }
    }

    await query('DELETE FROM product_documents WHERE id = $1', [documentId]);
    return doc;
  }
}

module.exports = new DocumentsService();

