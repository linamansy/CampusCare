const express = require('express');
const router = express.Router();
const controller = require('../controllers/todoController');

// Worker route FIRST
router.get('/assigned', controller.getAssignedIssues);

// Other routes
router.get('/', controller.getAllIssues);
router.post('/', controller.createIssue);

// Worker actions
router.put('/:id/status', controller.updateIssueStatus);
router.post('/comments', controller.createComment);

module.exports = router;