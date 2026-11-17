const multer = require('multer');
const path = require('path');
const fs = require('fs');

const docUploadDir = path.resolve(__dirname, '../../uploads/documents');
const videoUploadDir = path.resolve(__dirname, '../../uploads/videos');

[docUploadDir, videoUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) {
      cb(null, videoUploadDir);
    } else {
      cb(null, docUploadDir);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedDocExts = ['.pdf'];
  const allowedVideoExts = ['.mp4', '.webm', '.mov', '.mkv'];
  const allowedDocTypes = ['application/pdf', 'application/x-pdf'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isDoc = allowedDocExts.includes(ext) || allowedDocTypes.includes(mime);
  const isVideo = allowedVideoExts.includes(ext) || allowedVideoTypes.includes(mime);

  if (!isDoc && !isVideo) {
    return cb(new Error('Invalid format. Allowed formats: PDF (.pdf) or Video (.mp4, .webm, .mov).'), false);
  }

  cb(null, true);
};

const documentUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB limit to support tutorial videos
  }
});

/**
 * Validate that uploaded file actually has PDF magic bytes (%PDF)
 */
function verifyPdfMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString('utf8').startsWith('%PDF');
  } catch (err) {
    return false;
  }
}

module.exports = {
  documentUpload,
  verifyPdfMagicBytes,
  docUploadDir,
  videoUploadDir
};

