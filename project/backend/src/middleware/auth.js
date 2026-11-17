const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
require('dotenv').config();

const INSECURE_FALLBACKS = [
  'oxybott_default_secret_key_change_me',
  'oxybott_super_secure_jwt_secret_key_2026_change_in_production',
  'your_production_high_entropy_jwt_secret_here_minimum_32_chars',
  'secret',
  'password',
  '123456',
  'changeme'
];

function validateAuthConfiguration() {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = (process.env.JWT_SECRET || '').trim();

  if (isProd) {
    if (!secret || secret.length < 32 || INSECURE_FALLBACKS.includes(secret)) {
      throw new Error(
        '[SECURITY FATAL] Refusing to start in production: JWT_SECRET is missing, shorter than 32 characters, or using a known insecure default.'
      );
    }
  } else if (!secret || INSECURE_FALLBACKS.includes(secret)) {
    console.warn('\x1b[33m[SECURITY WARNING] Running with development JWT secret. Configure a strong JWT_SECRET before deploying to production.\x1b[0m');
  }
}

validateAuthConfiguration();

const JWT_SECRET = process.env.JWT_SECRET || 'oxybott_dev_secret_key_88f921ab04e76d33c5e0129a';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

async function requireAdminAuth(req, res, next) {
  let token = null;
  let isCookieAuth = false;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.oxybott_token) {
    token = req.cookies.oxybott_token;
    isCookieAuth = true;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  // Anti-CSRF protection for cookie-authenticated state-changing requests
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (isCookieAuth && stateChangingMethods.includes(req.method.toUpperCase())) {
    const hasCsrfHeader = req.headers['x-requested-with'] || req.headers['x-oxybott-csrf'];
    if (!hasCsrfHeader) {
      return res.status(403).json({
        success: false,
        error: 'CSRF Protection: Cookie-authenticated state-changing operations require custom header (X-Requested-With or X-Oxybott-CSRF).'
      });
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await query('SELECT id, username, email, role FROM admin_users WHERE id = $1', [decoded.id]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid token. Please log in again.' });
  }
}

async function recordAuditLog(req, action, entityType, entityId, details = null) {
  try {
    const userId = req.user ? req.user.id : null;
    const username = req.user ? req.user.username : 'system';
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const detailStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

    await query(`
      INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, username, action, entityType, String(entityId || ''), detailStr, ip]);
  } catch (err) {
    console.error('Audit logging error:', err.message);
  }
}

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  requireAdminAuth,
  recordAuditLog,
  validateAuthConfiguration
};

