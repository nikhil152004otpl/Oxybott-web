const authService = require('../services/auth.service');
const { recordAuditLog } = require('../middleware/auth');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const { token, user } = await authService.login(username, password);

      res.cookie('oxybott_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      req.user = user;
      await recordAuditLog(req, 'LOGIN', 'USER', user.id, `User ${user.username} logged in successfully`);

      res.json({
        success: true,
        token,
        user
      });
    } catch (err) {
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

