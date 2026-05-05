const express = require('express');
const router = express.Router();
const controller = require('../controllers/todoController');
const workerIssueController = require('../controllers/workerIssueController');
const completionPhotoUpload = require('../middleware/completionPhotoUpload');

// Worker route FIRST
router.get('/assigned', workerIssueController.getAssignedIssues);

// Other routes
router.get('/', controller.getAllIssues);
router.post('/', controller.createIssue);

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
