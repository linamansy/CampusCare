const express = require('express');
const router = express.Router();

const managerController = require('../controllers/managerController');
const todoController = require('../controllers/todoController');

// Manager routes are isolated from /issues so Person 7 and worker routes do not conflict.
router.get('/issues', managerController.getManagerIssues);
router.get('/issues/filter', managerController.filterManagerIssues);
router.get('/issues/search', managerController.searchManagerIssues);
router.put('/issues/:id/status', todoController.updateIssueStatus);

module.exports = router;
