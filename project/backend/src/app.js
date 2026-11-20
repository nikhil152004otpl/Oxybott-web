const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const apiRoutes = require('./routes');
const { validateAuthConfiguration } = require('./middleware/auth');

const app = express();

// Security check
validateAuthConfiguration();

// Security headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Configured separately if needed
  crossOriginEmbedderPolicy: false
}));
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please wait 15 minutes.' },
  handler: async (req, res, next, options) => {
    // Log brute-force attempt to security_events
    try {
      const { query } = require('./config/db');
      const { randomUUID } = require('crypto');
      const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
      await query(`
        INSERT INTO security_events (id, event_type, ip_address, username, details, severity, created_at)
        VALUES ($1, 'rate_limit_exceeded', $2, $3, $4, 'high', CURRENT_TIMESTAMP)
      `, [randomUUID(), ip, req.body?.username || '', `Rate limit hit on ${req.path}`]).catch(() => {});
    } catch {}
    res.status(options.statusCode).json(options.message);
  }
});

// Lightweight analytics tracking limiter
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: false,
  legacyHeaders: false
});

app.use('/api', generalLimiter);
app.use('/api/admin/auth', authLimiter);
app.use('/api/analytics/track', trackLimiter);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for local dev & preview
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploads - support all candidate upload directories
const candidateUploadDirs = [
  path.resolve(path.join(__dirname, '../uploads')),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(__dirname, '../../../../uploads')
].filter((dir, idx, self) => self.indexOf(dir) === idx);

candidateUploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  ['documents', 'products', 'videos', 'software'].forEach(sub => {
    const subDir = path.join(dir, sub);
    if (!fs.existsSync(subDir)) {
      try { fs.mkdirSync(subDir, { recursive: true }); } catch {}
    }
  });
  app.use('/uploads', express.static(dir));
});

// Prevent browser and proxy caching on API routes so changes reflect immediately
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'oxybott-backend-api'
  });
});

// 404 Handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `Endpoint ${req.method} ${req.originalUrl} not found.` });
});

// Serve frontend production build for deployment if available
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Centralized Error Handler Middleware
app.use((err, req, res, next) => {
  if (err && (err.name === 'MulterError' || (err.message && (err.message.includes('Invalid image') || err.message.includes('File too large'))))) {
    return res.status(400).json({ success: false, error: err.message });
  }

  console.error('[Application Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;

