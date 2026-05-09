const fs = require('fs');
const path = require('path');
const multer = require('multer');

const completionPhotoDir = path.join(__dirname, '..', '..', 'uploads', 'completion-photos');
fs.mkdirSync(completionPhotoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, completionPhotoDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

const completionPhotoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }

    cb(null, true);
  }
});

module.exports = completionPhotoUpload;
