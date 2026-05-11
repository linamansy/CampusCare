const {
  allowedFilterFields,
  getAllIssues,
  getFilteredIssues,
  searchIssues
} = require('../services/managerIssueService');
const prisma = require('../prismaClient');
const { createNotification } = require('../services/notificationService');
const {
  isAllowedStatus,
  isValidStatusTransition,
  normalizeStatus,
  parsePositiveInt,
  sanitizeText
} = require('../utils/issueHelpers');

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;
const VALID_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const issueInclude = { user: true, comments: true };

const getIssueForWorkflow = async (issueId) => {
  if (!issueId) {
    return { error: { status: 400, message: 'Invalid issue ID' } };
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });

  if (!issue) {
    return { error: { status: 404, message: 'Issue not found' } };
  }

  return { issue };
};

const updateIssueStatus = async (issue, nextStatus, extraData = {}, notifications = []) => {
  if (!isAllowedStatus(nextStatus)) {
    return { error: { status: 400, message: 'Invalid status' } };
  }

  if (!isValidStatusTransition(issue.status, nextStatus)) {
    return {
      error: {
        status: 409,
        message: `Invalid status transition from ${issue.status} to ${nextStatus}`
      }
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedIssue = await tx.issue.update({
      where: { id: issue.id },
      data: {
        ...extraData,
        status: nextStatus
      },
      include: issueInclude
    });

    for (const notification of notifications) {
      await createNotification(notification, tx);
    }

    return updatedIssue;
  });

  return { issue: updated };
};

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
      error: `Invalid filter(s): ${invalidFilters.join(', ')}. Use status, category, location, or priority.`
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
      error: 'At least one filter is required: status, category, location, or priority'
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

exports.assignIssue = async (req, res) => {
  const issueId = parsePositiveInt(req.params.id);
  const workerId = parsePositiveInt(req.body.workerId);

  if (!workerId) {
    return res.status(400).json({ error: 'Missing or invalid workerId' });
  }

  try {
    const { issue, error } = await getIssueForWorkflow(issueId);

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const worker = await prisma.user.findUnique({ where: { id: workerId } });

    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (!worker.isActive) {
      return res.status(400).json({ error: 'Cannot assign ticket to inactive worker' });
    }

    const result = await updateIssueStatus(issue, 'Assigned', { assignedTo: workerId }, [
      {
        userId: workerId,
        type: 'ISSUE_ASSIGNED',
        title: 'Ticket assigned',
        message: `Ticket #${issue.id} has been assigned to you.`,
        issueId: issue.id
      },
      {
        userId: issue.userId,
        type: 'STATUS_CHANGED',
        title: 'Ticket assigned',
        message: `Ticket #${issue.id} has been assigned to a worker.`,
        issueId: issue.id
      }
    ]);

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    res.json({ message: 'Issue assigned', issue: result.issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateIssuePriority = async (req, res) => {
  const issueId = parsePositiveInt(req.params.id);
  const priority = typeof req.body.priority === 'string' ? req.body.priority.trim() : '';

  if (!issueId) {
    return res.status(400).json({ error: 'Invalid issue ID' });
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority', allowedPriorities: VALID_PRIORITIES });
  }

  try {
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { priority },
      include: issueInclude
    });

    res.json({ message: 'Issue priority updated', issue });
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(500).json({ error: error.message });
  }
};

exports.updateIssueStatus = async (req, res) => {
  const issueId = parsePositiveInt(req.params.id);
  const nextStatus = normalizeStatus(req.body.status);

  if (!nextStatus) {
    return res.status(400).json({ error: 'Missing status' });
  }

  try {
    const { issue, error } = await getIssueForWorkflow(issueId);

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const notifications = [
      {
        userId: issue.userId,
        type: 'STATUS_CHANGED',
        title: 'Ticket status changed',
        message: `Ticket #${issue.id} is now ${nextStatus}.`,
        issueId: issue.id
      }
    ];

    if (issue.assignedTo) {
      notifications.push({
        userId: issue.assignedTo,
        type: 'STATUS_CHANGED',
        title: 'Assigned ticket status changed',
        message: `Ticket #${issue.id} is now ${nextStatus}.`,
        issueId: issue.id
      });
    }

    const result = await updateIssueStatus(issue, nextStatus, {}, notifications);

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    res.json({ message: 'Issue status updated', issue: result.issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resolveIssue = async (req, res) => {
  try {
    const { issue, error } = await getIssueForWorkflow(parsePositiveInt(req.params.id));

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const result = await updateIssueStatus(issue, 'Resolved', {
      resolvedAt: new Date(),
      rejectionReason: null
    }, [
      {
        userId: issue.userId,
        type: 'ISSUE_RESOLVED',
        title: 'Ticket resolved',
        message: `Ticket #${issue.id} has been marked resolved.`,
        issueId: issue.id
      }
    ]);

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    res.json({ message: 'Issue resolved', issue: result.issue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectIssue = async (req, res) => {
  const reason = sanitizeText(req.body.reason);

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  try {
    const { issue, error } = await getIssueForWorkflow(parsePositiveInt(req.params.id));

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (!isValidStatusTransition(issue.status, 'Rejected')) {
      return res.status(409).json({
        error: `Invalid status transition from ${issue.status} to Rejected`
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.comment.create({
        data: {
          issueId: issue.id,
          text: `Resolution rejected: ${reason}`
        }
      });

      const updatedIssue = await tx.issue.update({
        where: { id: issue.id },
        data: { status: 'Rejected', rejectionReason: reason },
        include: issueInclude
      });

      if (issue.assignedTo) {
        await createNotification({
          userId: issue.assignedTo,
          type: 'RESOLUTION_REJECTED',
          title: 'Resolution rejected',
          message: `Ticket #${issue.id} was rejected: ${reason}`,
          issueId: issue.id
        }, tx);
      }

      return updatedIssue;
    });

    res.json({ message: 'Issue rejected', issue: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requestRework = async (req, res) => {
  const reason = sanitizeText(req.body.reason);

  if (!reason) {
    return res.status(400).json({ error: 'Rework reason is required' });
  }

  try {
    const { issue, error } = await getIssueForWorkflow(parsePositiveInt(req.params.id));

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (!isValidStatusTransition(issue.status, 'In Progress')) {
      return res.status(409).json({
        error: `Invalid status transition from ${issue.status} to In Progress`
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.comment.create({
        data: {
          issueId: issue.id,
          text: `Rework requested: ${reason}`
        }
      });

      const updatedIssue = await tx.issue.update({
        where: { id: issue.id },
        data: { status: 'In Progress', rejectionReason: reason },
        include: issueInclude
      });

      if (issue.assignedTo) {
        await createNotification({
          userId: issue.assignedTo,
          type: 'REWORK_REQUESTED',
          title: 'Rework requested',
          message: `Ticket #${issue.id} needs rework: ${reason}`,
          issueId: issue.id
        }, tx);
      }

      return updatedIssue;
    });

    res.json({ message: 'Issue returned for rework', issue: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'Worker' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.getWorkerProfile = async (req, res) => {
  const workerId = parsePositiveInt(req.params.id);

  if (!workerId) {
    return res.status(400).json({ error: 'Invalid worker ID' });
  }

  try {
    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const assignedIssues = await prisma.issue.findMany({
      where: { assignedTo: workerId },
      orderBy: { updatedAt: 'desc' },
      include: { comments: true }
    });

    res.json({ worker, assignedIssues });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.activateWorker = async (req, res) => {
  try {
    const workerId = parsePositiveInt(req.params.id);

    if (!workerId) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const worker = await prisma.user.findUnique({ where: { id: workerId } });

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
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json({ message: 'Worker activated', worker: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.deactivateWorker = async (req, res) => {
  try {
    const workerId = parsePositiveInt(req.params.id);

    if (!workerId) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }

    const worker = await prisma.user.findUnique({ where: { id: workerId } });

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
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json({ message: 'Worker deactivated', worker: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};
