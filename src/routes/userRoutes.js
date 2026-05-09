const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/rbac');

const controller = require('../controllers/userController');

// All user endpoints require admin role
router.get('/', requireAdmin(), controller.getAllUsers);
router.post('/', requireAdmin(), controller.createUser);

module.exports = router;
