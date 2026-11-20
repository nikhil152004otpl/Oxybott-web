const authService = require('../services/auth.service');
const { recordAuditLog } = require('../middleware/auth');
const { query } = require('../config/db');
const { randomUUID } = require('crypto');

class AuthController {
  async login(req, res) {
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const { username, password } = req.body;

    try {
      const { token, user } = await authService.login(username, password);

      res.cookie('oxybott_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      req.user = user;
      await recordAuditLog(req, 'LOGIN', 'USER', user.id, `User ${user.username} logged in successfully`);

      // Log successful login security event
      await query(`
        INSERT INTO security_events (id, event_type, ip_address, username, details, severity, created_at)
        VALUES ($1, 'successful_login', $2, $3, $4, 'info', CURRENT_TIMESTAMP)
      `, [randomUUID(), ip, user.username, `Successful login for ${user.username}`]).catch(() => {});

      res.json({
        success: true,
        token,
        user
      });
    } catch (err) {
      // Log failed login security event
      await query(`
        INSERT INTO security_events (id, event_type, ip_address, username, details, severity, created_at)
        VALUES ($1, 'failed_login', $2, $3, $4, 'medium', CURRENT_TIMESTAMP)
      `, [randomUUID(), ip, username || '', `Failed login attempt: ${err.message}`]).catch(() => {});

      const statusCode = err.message.includes('required') ? 400 : 401;
      res.status(statusCode).json({ success: false, error: err.message });
    }
  }

  getMe(req, res) {
    res.json({
      success: true,
      user: req.user
    });
  }

  logout(req, res) {
    res.clearCookie('oxybott_token');
    res.json({ success: true, message: 'Logged out successfully.' });
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      await recordAuditLog(req, 'PASSWORD_CHANGE', 'USER', req.user.id, 'User password changed');
      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new AuthController();

