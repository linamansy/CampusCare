const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

const controller =
  require('../controllers/todoController');

const workerIssueController =
  require('../controllers/workerIssueController');

const completionPhotoUpload =
  require('../middleware/completionPhotoUpload');

const { verifyAuth } =
  require('../middleware/auth');

const {
  requireWorker
} = require('../middleware/rbac');

const workerAuth = requireWorker();

const uploadDir = path.join(
  __dirname,
  '..',
  '..',
  'uploads',
  'issues'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

const storage = multer.memoryStorage();

// Debug middleware to log multipart requests
router.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data') || req.method === 'POST') {
    console.log(`--- [DEBUG] Incoming ${req.method} Request ---`);
    console.log('URL:', req.url);
    console.log('Content-Type:', contentType);
    console.log('All Header Keys:', Object.keys(req.headers).join(', '));
    
    if (contentType.includes('multipart/form-data') && !contentType.includes('boundary=')) {
      console.warn('!!! WARNING: Multipart request missing boundary string !!!');
    }
    
    // Log auth token presence
    if (req.headers['authorization']) {
      console.log('Authorization: Present (starts with ' + req.headers['authorization'].substring(0, 15) + '...)');
    } else {
      console.log('Authorization: MISSING');
    }
    console.log('-----------------------------------------');
  }
  next();
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Increased to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Be very lenient with image types for mobile compatibility
    // Some mobile devices might send slightly different mime types
    if (!file.mimetype || file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
      return cb(null, true);
    }
    console.warn('!!! Multer Rejected File:', file.originalname, 'MimeType:', file.mimetype);
    return cb(new Error('Only images are allowed'));
  }
});

// Worker routes

router.get(
  '/assigned',
  workerAuth,
  workerIssueController.getAssignedIssues
);

router.put(
  '/:id/in-progress',
  workerAuth,
  workerIssueController.markInProgress
);

router.put(
  '/:id/completed',
  workerAuth,
  workerIssueController.markCompleted
);

// Must be before "/:id/completion-photo" so "/comments" is not captured as :id
router.post(
  '/comments',
  workerAuth,
  controller.createComment
);



router.post(
  '/:id/completion-photo',
  workerAuth,
  upload.any(),
  (req, res, next) => {
    console.log('Worker Photo Upload Body Keys:', Object.keys(req.body));
    console.log('Worker Photo Upload File:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'MISSING');
    next();
  },
  workerIssueController.uploadCompletionPhoto
);

// Issue routes

router.get(
  '/',
  controller.getAllIssues
);

router.get(
  '/my',
  verifyAuth,
  controller.getMyIssues
);

router.get(
  '/user',
  verifyAuth,
  controller.getUserIssues
);

router.get(
  '/user/:userId',
  verifyAuth,
  controller.getMyIssues
);

router.get(
  '/notifications',
  verifyAuth,
  controller.getUserNotifications
);

router.put(
  '/notifications/:id/read',
  verifyAuth,
  controller.markNotificationRead
);

router.get(
  '/:id',
  controller.getIssueById
);

// Comments

router.get(
  '/:id/comments',
  controller.getCommentsByIssue
);

router.post(
  '/:id/comments',
  verifyAuth,
  controller.createComment
);

// Create issue

router.post(
  '/',
  verifyAuth,
  upload.any(),
  (req, res, next) => {
    console.log('Create Issue Body:', req.body);
    console.log('Create Issue File:', req.file);
    next();
  },
  controller.createIssue
);

// Update issue

router.put(
  '/:id/status',
  verifyAuth,
  controller.updateIssueStatus
);

router.put(
  '/:id/assign',
  verifyAuth,
  controller.assignWorker
);

router.put(
  '/:id/close',
  verifyAuth,
  controller.closeIssue
);

// Upload issue photo

router.post(
  '/:id/photo',
  verifyAuth,
  upload.any(),
  controller.uploadIssuePhoto
);

// Verify issue

router.post(
  '/:id/verify',
  verifyAuth,
  controller.verifyResolution
);

// Delete issue

router.delete(
  '/:id',
  verifyAuth,
  controller.deleteIssue
);

module.exports = router;