const { query } = require('../config/db');

class InquiriesService {
  async createInquiry(data, clientIp) {
    const { type, name, email, organization, phone, subject, message, details } = data;

    const validTypes = ['contact', 'quote', 'trial', 'newsletter'];
    const inquiryType = (type && validTypes.includes(type.toLowerCase())) ? type.toLowerCase() : 'contact';

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error('A valid email address is required.');
    }

    if (inquiryType !== 'newsletter') {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Name is required.');
      }
    }

    const cleanEmail = email.trim().toLowerCase().slice(0, 255);
    const cleanName = (name || '').trim().slice(0, 200);
    const cleanOrg = (organization || '').trim().slice(0, 200);
    const cleanPhone = (phone || '').trim().slice(0, 50);
    const cleanSubject = (subject || (
      inquiryType === 'quote' ? 'School STEM Kit Quotation' :
      inquiryType === 'trial' ? 'Curriculum Trial Request' :
      inquiryType === 'newsletter' ? 'Newsletter Subscription' : 'General Inquiry'
    )).trim().slice(0, 300);
    const cleanMessage = (message || '').trim().slice(0, 5000);
    const detailsStr = typeof details === 'object' && details !== null 
      ? JSON.stringify(details) 
      : (typeof details === 'string' ? details.slice(0, 5000) : null);

    // Duplicate check: Same email + type within 60 seconds
    const dupRes = await query(`
      SELECT id FROM inquiries 
      WHERE email = $1 AND type = $2 AND created_at >= (NOW() - INTERVAL '60 seconds')
    `, [cleanEmail, inquiryType]);

    if (dupRes.rows.length > 0) {
      return {
        isDuplicate: true,
        id: dupRes.rows[0].id,
        message: 'Your inquiry was already received and is being processed by our STEM education team.'
      };
    }

    const id = `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await query(`
      INSERT INTO inquiries (id, type, name, email, organization, phone, subject, message, details, status, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10)
    `, [id, inquiryType, cleanName, cleanEmail, cleanOrg, cleanPhone, cleanSubject, cleanMessage, detailsStr, clientIp]);

    const messageResponse = inquiryType === 'newsletter'
      ? 'Thank you for subscribing to Oxybott STEM news!'
      : inquiryType === 'quote'
      ? 'Quotation request received! Our STEM curriculum specialist will send an institutional proposal within 24 hours.'
      : inquiryType === 'trial'
      ? 'Curriculum trial request submitted! Our education team will verify your school credentials and prepare your kit.'
      : 'Thank you! Your message has been received by the Oxybott team.';

    return {
      isDuplicate: false,
      id,
      message: messageResponse
    };
  }

  async adminGetInquiries(filters = {}) {
    const { type, status, search, limit = 50, offset = 0 } = filters;
    let sql = 'SELECT * FROM inquiries WHERE 1=1';
    const params = [];
    let pIdx = 1;

    if (type) {
      sql += ` AND type = $${pIdx++}`;
      params.push(type);
    }
    if (status) {
      sql += ` AND status = $${pIdx++}`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (name ILIKE $${pIdx} OR email ILIKE $${pIdx} OR organization ILIKE $${pIdx} OR subject ILIKE $${pIdx})`;
      params.push(`%${search}%`);
      pIdx++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(Number(limit), Number(offset));

    const res = await query(sql, params);
    const countRes = await query('SELECT COUNT(*) as total FROM inquiries');
    const total = countRes.rows.length > 0 ? parseInt(countRes.rows[0].total, 10) : res.rows.length;

    return {
      inquiries: res.rows,
      total
    };
  }

  async updateInquiryStatus(id, status) {
    const validStatuses = ['new', 'in_progress', 'resolved', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const res = await query('UPDATE inquiries SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);
    if (res.rowCount === 0) throw new Error('Inquiry not found.');
  }

  async deleteInquiry(id) {
    const res = await query('DELETE FROM inquiries WHERE id = $1', [id]);
    if (res.rowCount === 0) throw new Error('Inquiry not found.');
  }
}

module.exports = new InquiriesService();

