const mediaService = require('../services/media.service');
const { recordAuditLog } = require('../middleware/auth');

class MediaController {
  async adminGetMediaAssets(req, res) {
    try {
      const { type, search, page, limit } = req.query;
      const assets = await mediaService.getMediaAssets({
        type,
        search,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 50
      });
      res.json({ success: true, count: assets.length, assets });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminUploadMediaAsset(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No media file provided.' });
      }

      const { alt_text, asset_type } = req.body;
      const asset = await mediaService.registerMediaAsset(req.file, alt_text, asset_type);
      await recordAuditLog(req, 'UPLOAD_MEDIA', 'MEDIA_ASSET', asset.id, `Uploaded ${asset.asset_type} "${asset.file_name}"`);

      res.status(201).json({ success: true, message: 'Asset uploaded successfully.', asset });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminDeleteMediaAsset(req, res) {
    try {
      const { id } = req.params;
      const result = await mediaService.deleteMediaAsset(id);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      await recordAuditLog(req, 'DELETE_MEDIA', 'MEDIA_ASSET', id, `Deleted media asset ${id}`);
      res.json({ success: true, message: 'Media asset deleted successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new MediaController();

