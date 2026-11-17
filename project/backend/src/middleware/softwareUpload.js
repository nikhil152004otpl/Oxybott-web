const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const softwareDir = path.resolve(__dirname, '../../uploads/software');
if (!fs.existsSync(softwareDir)) {
  fs.mkdirSync(softwareDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, softwareDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const allowedExtensions = ['.exe', '.msi', '.dmg', '.pkg', '.apk', '.zip', '.bin', '.hex', '.uf2', '.pdf', '.appimage', '.tar.gz', '.tgz'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error(`Invalid software package extension "${ext}". Allowed: ${allowedExtensions.join(', ')}`), false);
  }
};

const softwareUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB max for software installers
  }
});

function calculateSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

module.exports = { softwareUpload, calculateSha256, softwareDir };

