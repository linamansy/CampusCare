const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const controller = require('../controllers/todoController');
const { verifyAuth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'issues');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error('Only PNG and JPG images are allowed')
    );
  }
});

// Issue routes
router.get('/', controller.getAllIssues);

router.get('/user', controller.getUserIssues);

router.get(
  '/user/:userId',
  verifyAuth,
  controller.getMyIssues
);

router.get('/:id', controller.getIssueById);

// Comments routes
router.get('/:id/comments', controller.getCommentsByIssue);

router.post('/:id/comments', controller.createComment);

// Create issue
router.post(
  '/',
  verifyAuth,
  upload.single('image'),
  controller.createIssue
);

module.exports = router;