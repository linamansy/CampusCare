const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/rbac');
const { verifyAuth } = require('../middleware/auth');

const controller = require('../controllers/userController');

// Public leaderboard (authenticated users only)
router.get('/leaderboard', verifyAuth, controller.getLeaderboard);
router.get('/leaderboard/workers', verifyAuth, controller.getWorkerLeaderboard);

// All user CRUD endpoints require admin role
router.get('/', requireAdmin(), controller.getAllUsers);
router.post('/', requireAdmin(), controller.createUser);

module.exports = router;
