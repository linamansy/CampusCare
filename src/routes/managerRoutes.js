```javascript id="x7m2qp"
const express = require('express');

const router = express.Router();

const {
  requireManagerOrAdmin
} = require('../middleware/rbac');

const managerController = require('../controllers/managerController');

// Manager routes require Facility Manager or Admin role

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

router.put(
  '/issues/:id/assign',
  requireManagerOrAdmin(),
  managerController.assignIssue
);

router.put(
  '/issues/:id/priority',
  requireManagerOrAdmin(),
  managerController.updateIssuePriority
);

router.put(
  '/issues/:id/status',
  requireManagerOrAdmin(),
  managerController.updateIssueStatus
);

router.put(
  '/issues/:id/resolve',
  requireManagerOrAdmin(),
  managerController.resolveIssue
);

router.put(
  '/issues/:id/reject',
  requireManagerOrAdmin(),
  managerController.rejectIssue
);

router.put(
  '/issues/:id/rework',
  requireManagerOrAdmin(),
  managerController.requestRework
);

// Worker management endpoints

router.get(
  '/workers',
  requireManagerOrAdmin(),
  managerController.getWorkers
);

router.get(
  '/workers/:id',
  requireManagerOrAdmin(),
  managerController.getWorkerProfile
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
```
