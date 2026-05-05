const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');
const { parsePositiveInt } = require('../utils/issueHelpers');

exports.getAssignedIssues = async (req, res) => {
  const workerId = parsePositiveInt(req.query.workerId);

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
    res.status(500).json({ error: error.message });
  }
};

exports.markInProgress = async (req, res) => {
  const issueId = parsePositiveInt(req.params.id);
  const workerId = parsePositiveInt(req.body.workerId);

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
    res.status(500).json({ error: error.message });
  }
};

exports.uploadCompletionPhoto = async (req, res) => {
  const issueId = parsePositiveInt(req.params.id);
  const workerId = parsePositiveInt(req.body.workerId);

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

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
