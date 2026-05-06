const express = require('express');
const router = express.Router();
const controller = require('../controllers/todoController');

router.get('/', controller.getAllIssues);
router.post('/', controller.createIssue);
router.get('/:id', controller.getIssueById);
router.get('/:id/comments', controller.getCommentsByIssue);
router.post('/:id/comments', controller.createComment);

module.exports = router;