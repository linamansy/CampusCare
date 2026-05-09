const express = require('express');
const router = express.Router();
const { requireManagerOrAdmin } = require('../middleware/rbac');

const managerController = require('../controllers/managerController');

// Manager routes require Facility Manager or Admin role
router.get('/issues', requireManagerOrAdmin(), managerController.getManagerIssues);
router.get('/issues/filter', requireManagerOrAdmin(), managerController.filterManagerIssues);
router.get('/issues/search', requireManagerOrAdmin(), managerController.searchManagerIssues);

// Worker management endpoints (FM only)
router.get('/workers', requireManagerOrAdmin(), managerController.getWorkers);
router.put('/workers/:id/activate', requireManagerOrAdmin(), managerController.activateWorker);
router.put('/workers/:id/deactivate', requireManagerOrAdmin(), managerController.deactivateWorker);

module.exports = router;
