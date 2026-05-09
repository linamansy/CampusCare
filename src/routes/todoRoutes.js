const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const controller = require('../controllers/todoController');
const { verifyAuth } = require('../middleware/auth');

const workerIssueController = require('../controllers/workerIssueController');

const completionPhotoUpload = require('../middleware/completionPhotoUpload');

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

// Worker route FIRST
router.get('/assigned', workerIssueController.getAssignedIssues);

// Issue routes
router.get('/', controller.getAllIssues);
router.get('/user', controller.getUserIssues);
router.get(
  '/user/:userId',
  verifyAuth,
  controller.getMyIssues
);

// Comments routes
router.get('/:id/comments', controller.getCommentsByIssue);
router.post('/:id/comments', controller.createComment);

router.get('/:id', controller.getIssueById);
router.delete('/:id', controller.deleteIssue);

// Create issue
router.post(
  '/',
  verifyAuth,
  upload.single('image'),
  controller.createIssue
);

// Worker actions
router.put('/:id/in-progress', workerIssueController.markInProgress);
router.put('/:id/status', controller.updateIssueStatus);
router.post('/comments', controller.createComment);
router.post(
  '/:id/completion-photo',
  completionPhotoUpload.single('photo'),
  workerIssueController.uploadCompletionPhoto
);

module.exports = router;
