const path = require('path');
const fs = require('fs');
const documentsService = require('../services/documents.service');
const { verifyPdfMagicBytes } = require('../middleware/documentUpload');
const { recordAuditLog } = require('../middleware/auth');

class DocumentsController {
  /**
   * GET /api/products/:productId/documents
   * Public list of documents for a product
   */
  async getDocumentsByProduct(req, res) {
    try {
      const { productId } = req.params;
      const documents = await documentsService.getDocumentsByProduct(productId);
      res.json({ success: true, count: documents.length, documents });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/admin/products/:productId/documents
   * Admin upload PDF document, Video file, or add YouTube/Video link
   */
  async uploadDocument(req, res) {
    try {
      const { productId } = req.params;
      const file = req.file;
      const { document_title, document_type, video_url } = req.body;

      if (!file && !video_url) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a PDF document, video file, or video link (e.g. YouTube).'
        });
      }

      // If file is PDF, verify authentic PDF magic bytes
      if (file && path.extname(file.originalname).toLowerCase() === '.pdf') {
        if (!verifyPdfMagicBytes(file.path)) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            error: 'Security verification failed: File is not a valid PDF document.'
          });
        }
      }

      const document = await documentsService.createDocument(productId, file, {
        document_title,
        document_type,
        video_url
      });

      await recordAuditLog(
        req,
        'UPLOAD_DOCUMENT',
        'DOCUMENT',
        document.id,
        `Added ${document.document_type} "${document.document_title}" (${document.video_url ? 'Video Link' : document.mime_type}) for product ${productId}`
      );

      res.status(201).json({
        success: true,
        message: 'Resource saved successfully.',
        document
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/admin/documents/:id
   * Admin replace document file, video, or update title/type/link
   */
  async replaceDocument(req, res) {
    try {
      const { id } = req.params;
      const file = req.file;
      const { document_title, document_type, video_url } = req.body;

      if (file && path.extname(file.originalname).toLowerCase() === '.pdf') {
        if (!verifyPdfMagicBytes(file.path)) {
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            error: 'Security verification failed: Replacement file is not a valid PDF document.'
          });
        }
      }

      const updated = await documentsService.replaceDocument(id, file, {
        document_title,
        document_type,
        video_url
      });

      await recordAuditLog(
        req,
        'REPLACE_DOCUMENT',
        'DOCUMENT',
        id,
        `Updated resource "${updated.document_title}" (${file ? 'replaced file' : 'updated metadata/link'})`
      );

      res.json({
        success: true,
        message: 'Resource updated successfully.',
        document: updated
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/admin/documents/:id
   * Admin delete document or video
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const doc = await documentsService.deleteDocument(id);

      await recordAuditLog(
        req,
        'DELETE_DOCUMENT',
        'DOCUMENT',
        id,
        `Deleted resource "${doc.document_title}" for product ${doc.product_id}`
      );

      res.json({ success: true, message: 'Resource deleted successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/documents/:id/download
   * Download PDF or video file with Content-Disposition attachment
   */
  async downloadDocument(req, res) {
    try {
      const { id } = req.params;
      const doc = await documentsService.getDocumentById(id);
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Document not found.' });
      }

      if (doc.video_url && !doc.file_path) {
        return res.redirect(doc.video_url);
      }

      const diskPath = path.resolve(__dirname, '../../', doc.file_path.replace(/^\//, ''));
      if (!fs.existsSync(diskPath)) {
        return res.status(404).json({ success: false, error: 'Document file not found on server.' });
      }

      res.download(diskPath, doc.original_filename);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/documents/:id/view
   * Inline PDF view or video streaming in browser
   */
  async viewDocument(req, res) {
    try {
      const { id } = req.params;
      const doc = await documentsService.getDocumentById(id);
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Document not found.' });
      }

      if (doc.video_url && !doc.file_path) {
        return res.redirect(doc.video_url);
      }

      const diskPath = path.resolve(__dirname, '../../', doc.file_path.replace(/^\//, ''));
      if (!fs.existsSync(diskPath)) {
        return res.status(404).json({ success: false, error: 'Document file not found on server.' });
      }

      res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${doc.original_filename}"`);
      const stream = fs.createReadStream(diskPath);
      stream.pipe(res);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new DocumentsController();

