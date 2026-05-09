const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');
const { parsePositiveInt } = require('../utils/issueHelpers');
const { addPoints } = require('../services/pointsService');

const resolveWorkerId = (req, bodyWorkerId) => {
  const parsedBodyWorkerId = parsePositiveInt(bodyWorkerId);
  const tokenWorkerId = req.user ? parsePositiveInt(req.user.id) : null;

  if (parsedBodyWorkerId && tokenWorkerId && parsedBodyWorkerId !== tokenWorkerId) {
    return null;
  }

  return parsedBodyWorkerId || tokenWorkerId;
};

exports.getAssignedIssues = async (req, res, next) => {
  const queryWorkerId = parsePositiveInt(req.query.workerId);
  const tokenWorkerId = req.user ? parsePositiveInt(req.user.id) : null;

  if (queryWorkerId && tokenWorkerId && queryWorkerId !== tokenWorkerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const workerId = queryWorkerId || tokenWorkerId;

  if (!workerId) {
    return res.status(400).json({ error: 'Missing or invalid workerId' });
  }

  try {
    const issues = await prisma.issue.findMany({
      where: { assignedTo: workerId },
      include: { comments: true }
    });

    res.json(issues);
  } catch (error) {
    next(error);
  }
};

exports.markInProgress = async (req, res, next) => {
  const issueId = parsePositiveInt(req.params.id);
  const workerId = resolveWorkerId(req, req.body.workerId);

  if (!issueId) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  if (!workerId) {
    return res.status(400).json({ error: 'Missing or invalid workerId' });
  }

  try {
    const { error } = await findIssueAssignedToWorker(issueId, workerId);

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { status: 'In Progress' }
    });

    res.json(issue);
  } catch (error) {
    next(error);
  }
};

exports.uploadCompletionPhoto = async (req, res, next) => {
  const issueId = parsePositiveInt(req.params.id);
  const workerId = resolveWorkerId(req, req.body.workerId);

  if (!issueId) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  if (!workerId) {
    return res.status(400).json({ error: 'Missing or invalid workerId' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Missing photo file' });
  }

  try {
    const { error } = await findIssueAssignedToWorker(issueId, workerId);

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const photoUrl = `/uploads/completion-photos/${req.file.filename}`;
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { completionPhotoUrl: photoUrl }
    });

    await addPoints(workerId, 5);

    res.json(issue);
  } catch (error) {
    next(error);
  }
};

exports.markCompleted = async (req, res, next) => {
  const issueId = parsePositiveInt(req.params.id);
  const workerId = resolveWorkerId(req, req.body.workerId);

  if (!issueId) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  if (!workerId) {
    return res.status(400).json({ error: 'Missing or invalid workerId' });
  }

  try {
    const { error } = await findIssueAssignedToWorker(issueId, workerId);

    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { status: 'Completed' }
    });

    await addPoints(workerId, 10);

    res.json(issue);
  } catch (error) {
    next(error);
  }
};
