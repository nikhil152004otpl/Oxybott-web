const { query } = require('../config/db');
const { generateToken, comparePassword, hashPassword } = require('../middleware/auth');

class AuthService {
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const userRes = await query(
      'SELECT * FROM admin_users WHERE username = $1 OR email = $1',
      [username]
    );

    if (userRes.rows.length === 0) {
      throw new Error('Invalid username or password.');
    }

    const user = userRes.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid username or password.');
    }

    await query('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const userRes = await query('SELECT * FROM admin_users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) throw new Error('User not found.');

    const user = userRes.rows[0];
    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new Error('Current password is incorrect.');
    }

    const newHash = await hashPassword(newPassword);
    await query('UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);
  }
}

module.exports = new AuthService();

