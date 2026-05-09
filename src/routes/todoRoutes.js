const express = require('express');
const router = express.Router();
const controller = require('../controllers/todoController');

router.get('/', controller.getAllIssues);
router.post('/', controller.createIssue);
router.get('/user', controller.getUserIssues);
router.delete('/:id', controller.deleteIssue);

module.exports = router;
