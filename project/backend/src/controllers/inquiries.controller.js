const inquiriesService = require('../services/inquiries.service');
const { recordAuditLog } = require('../middleware/auth');

class InquiriesController {
  async createInquiry(req, res) {
    try {
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const result = await inquiriesService.createInquiry(req.body, clientIp);

      if (result.isDuplicate) {
        return res.status(200).json({
          success: true,
          message: result.message,
          id: result.id
        });
      }

      res.status(201).json({
        success: true,
        message: result.message,
        id: result.id
      });
    } catch (err) {
      const statusCode = err.message.includes('required') || err.message.includes('valid') ? 400 : 500;
      res.status(statusCode).json({ success: false, error: err.message });
    }
  }

  async adminGetInquiries(req, res) {
    try {
      const data = await inquiriesService.adminGetInquiries(req.query);
      res.json({ success: true, ...data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async adminUpdateInquiryStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await inquiriesService.updateInquiryStatus(id, status);
      await recordAuditLog(req, 'UPDATE_INQUIRY_STATUS', 'INQUIRY', id, `Updated inquiry status to ${status}`);
      res.json({ success: true, message: `Inquiry status updated to ${status}.` });
    } catch (err) {
      const statusCode = err.message.includes('Invalid status') ? 400 : (err.message.includes('not found') ? 404 : 500);
      res.status(statusCode).json({ success: false, error: err.message });
    }
  }

  async adminDeleteInquiry(req, res) {
    try {
      const { id } = req.params;
      await inquiriesService.deleteInquiry(id);
      await recordAuditLog(req, 'DELETE_INQUIRY', 'INQUIRY', id, `Deleted inquiry ${id}`);
      res.json({ success: true, message: 'Inquiry deleted successfully.' });
    } catch (err) {
      const statusCode = err.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, error: err.message });
    }
  }
}

module.exports = new InquiriesController();

