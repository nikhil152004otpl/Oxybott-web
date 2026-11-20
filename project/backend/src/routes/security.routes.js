/**
 * Security Monitoring Routes – Admin security event log
 */
const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/auth');
const { query } = require('../config/db');

// GET /api/security/events?page=1&severity=&type=&ip=
router.get('/events', requireAdminAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;
    const severity = req.query.severity || '';
    const type = req.query.type || '';
    const ip = req.query.ip || '';
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let conditions = [`created_at >= $1`];
    let params = [since];
    let idx = 2;

    if (severity) { conditions.push(`severity = $${idx++}`); params.push(severity); }
    if (type) { conditions.push(`event_type = $${idx++}`); params.push(type); }
    if (ip) { conditions.push(`ip_address LIKE $${idx++}`); params.push(`%${ip}%`); }

    const where = 'WHERE ' + conditions.join(' AND ');

    const [rows, total, stats] = await Promise.all([
      query(`SELECT * FROM security_events ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
      query(`SELECT COUNT(*) as cnt FROM security_events ${where}`, params),
      query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN event_type = 'failed_login' THEN 1 ELSE 0 END) as failed_logins,
          SUM(CASE WHEN event_type = 'ip_blocked' THEN 1 ELSE 0 END) as blocked_ips
        FROM security_events WHERE created_at >= $1
      `, [since])
    ]);

    res.json({
      success: true,
      events: rows.rows,
      total: parseInt(total.rows[0]?.cnt || 0),
      stats: stats.rows[0],
      page, limit
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/security/top-ips – Most flagged IPs
router.get('/top-ips', requireAdminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const rows = await query(`
      SELECT ip_address, COUNT(*) as event_count,
             SUM(CASE WHEN event_type = 'failed_login' THEN 1 ELSE 0 END) as failed_logins,
             MAX(created_at) as last_seen
      FROM security_events
      WHERE created_at >= $1 AND ip_address IS NOT NULL AND ip_address != ''
      GROUP BY ip_address ORDER BY event_count DESC LIMIT 20
    `, [since]);
    res.json({ success: true, topIps: rows.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/security/export – CSV export
router.get('/export', requireAdminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const data = await query('SELECT * FROM security_events WHERE created_at >= $1 ORDER BY created_at DESC', [since]);

    const headers = ['ID', 'Event Type', 'IP Address', 'Username', 'Severity', 'Details', 'Timestamp'];
    const csvRows = data.rows.map(r => [
      r.id, r.event_type, r.ip_address || '—', r.username || '—',
      r.severity, r.details || '', r.created_at
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...csvRows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="security-events-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
