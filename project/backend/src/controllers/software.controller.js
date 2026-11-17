const softwareService = require('../services/software.service');
const { recordAuditLog } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

class SoftwareController {
  // --- Public Endpoints ---
  async getSoftwareCatalog(req, res) {
    try {
      const items = await softwareService.getSoftwareCatalog();
      res.json({ success: true, count: items.length, software: items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async downloadRelease(req, res) {
    try {
      const { releaseId } = req.params;
      const release = await softwareService.getReleaseForDownload(releaseId);
      if (!release) {
        return res.status(404).json({ success: false, error: 'Release not found.' });
      }

      if (release.external_url && !release.file_path) {
        return res.redirect(release.external_url);
      }

      if (!release.file_path || !fs.existsSync(release.file_path)) {
        return res.status(404).json({ success: false, error: 'Software release binary not found on storage server.' });
      }

      const downloadFileName = release.file_name || path.basename(release.file_path);
      res.download(release.file_path, downloadFileName);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- Admin Endpoints ---
  async adminGetAllSoftware(req, res) {
    try {
      const software = await softwareService.getAllSoftwareAdmin();
      res.json({ success: true, count: software.length, software });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminCreateSoftware(req, res) {
    try {
      const { name, slug } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Software product name is required.' });

      const id = await softwareService.createSoftwareItem(req.body);
      await recordAuditLog(req, 'CREATE_SOFTWARE', 'SOFTWARE', id, `Created software product "${name}"`);
      res.status(201).json({ success: true, message: 'Software product created.', id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminUpdateSoftware(req, res) {
    try {
      const { id } = req.params;
      await softwareService.updateSoftwareItem(id, req.body);
      await recordAuditLog(req, 'UPDATE_SOFTWARE', 'SOFTWARE', id, `Updated software product "${req.body.name || id}"`);
      res.json({ success: true, message: 'Software product updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminDeleteSoftware(req, res) {
    try {
      const { id } = req.params;
      await softwareService.deleteSoftwareItem(id);
      await recordAuditLog(req, 'DELETE_SOFTWARE', 'SOFTWARE', id, `Deleted software product ${id}`);
      res.json({ success: true, message: 'Software product deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminAddRelease(req, res) {
    try {
      const { id } = req.params;
      const releaseId = await softwareService.addRelease(id, req.body, req.file);
      await recordAuditLog(req, 'ADD_RELEASE', 'SOFTWARE_RELEASE', releaseId, `Added release v${req.body.version} (${req.body.platform}) for software ${id}`);
      res.status(201).json({ success: true, message: 'Release uploaded and published.', releaseId });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  async adminDeleteRelease(req, res) {
    try {
      const { releaseId } = req.params;
      await softwareService.deleteRelease(releaseId);
      await recordAuditLog(req, 'DELETE_RELEASE', 'SOFTWARE_RELEASE', releaseId, `Deleted release ${releaseId}`);
      res.json({ success: true, message: 'Release deleted.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new SoftwareController();

