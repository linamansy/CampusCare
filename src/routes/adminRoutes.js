const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/rbac');

const adminController = require('../controllers/adminController');

// All admin routes require Admin role
router.get('/users', requireAdmin(), adminController.getAllUsers);
router.put('/users/:id/activate', requireAdmin(), adminController.activateUser);
router.put('/users/:id/deactivate', requireAdmin(), adminController.deactivateUser);
router.put('/users/:id/promote', requireAdmin(), adminController.promoteUserRole);
router.delete('/users/:id', requireAdmin(), adminController.deleteUser);
router.put('/users/:id/verify', requireAdmin(), adminController.verifyUser);
router.put('/users/:id/reset-password', requireAdmin(), adminController.resetUserPassword);
router.get('/analytics', requireAdmin(), adminController.getAnalytics);
router.get('/categories', requireAdmin(), adminController.getCategories);
router.post('/categories', requireAdmin(), adminController.createCategory);
router.put('/categories/:name', requireAdmin(), adminController.updateCategory);
router.delete('/categories/:name', requireAdmin(), adminController.deleteCategory);

module.exports = router;
