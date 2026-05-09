const express = require('express');

const router = express.Router();

const {
  requireManagerOrAdmin
} = require('../middleware/rbac');

const managerController = require('../controllers/managerController');

const todoController = require('../controllers/todoController');

// Manager issue routes
router.get(
  '/issues',
  requireManagerOrAdmin(),
  managerController.getManagerIssues
);

router.get(
  '/issues/filter',
  requireManagerOrAdmin(),
  managerController.filterManagerIssues
);

router.get(
  '/issues/search',
  requireManagerOrAdmin(),
  managerController.searchManagerIssues
);

// Update issue status
router.put(
  '/issues/:id/status',
  requireManagerOrAdmin(),
  todoController.updateIssueStatus
);

// Worker management
router.get(
  '/workers',
  requireManagerOrAdmin(),
  managerController.getWorkers
);

router.put(
  '/workers/:id/activate',
  requireManagerOrAdmin(),
  managerController.activateWorker
);

router.put(
  '/workers/:id/deactivate',
  requireManagerOrAdmin(),
  managerController.deactivateWorker
);

module.exports = router;