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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const safeName =
      file.originalname.replace(
        /\s+/g,
        '_'
      );

    cb(
      null,
      `${Date.now()}-${safeName}`
    );
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

    if (
      allowed.includes(
        file.mimetype
      )
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        'Only PNG and JPG images are allowed'
      )
    );
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
  completionPhotoUpload.single(
    'completionPhoto'
  ),
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
  upload.single('image'),
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
  upload.single('image'),
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