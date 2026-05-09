const {
  allowedFilterFields,
  getAllIssues,
  getFilteredIssues,
  searchIssues
} = require('../services/managerIssueService');
const prisma = require('../prismaClient');

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

exports.getManagerIssues = async (req, res) => {
  try {
    const issues = await getAllIssues();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.filterManagerIssues = async (req, res) => {
  const filters = {};
  const invalidFilters = Object.keys(req.query).filter((key) => !allowedFilterFields.includes(key));

  if (invalidFilters.length > 0) {
    return res.status(400).json({
      error: `Invalid filter(s): ${invalidFilters.join(', ')}. Use status, category, or location.`
    });
  }

  for (const field of allowedFilterFields) {
    if (req.query[field] != null) {
      if (!hasValue(req.query[field])) {
        return res.status(400).json({ error: `${field} filter cannot be empty` });
      }

      filters[field] = req.query[field].trim();
    }
  }

  if (Object.keys(filters).length === 0) {
    return res.status(400).json({
      error: 'At least one filter is required: status, category, or location'
    });
  }

  try {
    const issues = await getFilteredIssues(filters);
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchManagerIssues = async (req, res) => {
  const query = req.query.q;

  if (!hasValue(query)) {
    return res.status(400).json({ error: 'Search query q is required' });
  }

  try {
    const issues = await searchIssues(query.trim());
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== WORKER MANAGEMENT ==========

/**
 * GET /manager/workers
 * Get all workers (only Workers role)
 */
exports.getWorkers = async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: {
        role: 'Worker'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /manager/workers/:id/activate
 * Activate a worker account
 */
exports.activateWorker = async (req, res) => {
  try {
    const workerId = parseInt(req.params.id, 10);

    if (isNaN(workerId)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const worker = await prisma.user.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.role !== 'Worker') {
      return res.status(400).json({ error: 'User is not a worker' });
    }

    const updated = await prisma.user.update({
      where: { id: workerId },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    res.json({ message: 'Worker activated', worker: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /manager/workers/:id/deactivate
 * Deactivate a worker account
 */
exports.deactivateWorker = async (req, res) => {
  try {
    const workerId = parseInt(req.params.id, 10);

    if (isNaN(workerId)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const worker = await prisma.user.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.role !== 'Worker') {
      return res.status(400).json({ error: 'User is not a worker' });
    }

    const updated = await prisma.user.update({
      where: { id: workerId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    res.json({ message: 'Worker deactivated', worker: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};
