const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');
const { notifyRole } = require('../services/notificationService');
const {
  isValidStatusTransition,
  parsePositiveInt,
  sanitizeText
} = require('../utils/issueHelpers');

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

    const currentIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { status: true }
    });

    if (!currentIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (!isValidStatusTransition(currentIssue.status, 'In Progress')) {
      return res.status(409).json({
        error: `Invalid status transition from ${currentIssue.status} to In Progress`
      });
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
  const completionNote = sanitizeText(req.body.note || req.body.completionNote || '');

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

    const currentIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { status: true }
    });

    if (!currentIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (!isValidStatusTransition(currentIssue.status, 'Under Review')) {
      return res.status(409).json({
        error: `Invalid status transition from ${currentIssue.status} to Under Review`
      });
    }

    const photoUrl = `/uploads/completion-photos/${req.file.filename}`;
    const issue = await prisma.$transaction(async (tx) => {
      if (completionNote) {
        await tx.comment.create({
          data: {
            issueId,
            text: `Completion note: ${completionNote}`
          }
        });
      }

      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          completionPhotoUrl: photoUrl,
          completionNote: completionNote || null,
          status: 'Under Review'
        },
        include: { comments: true, user: true }
      });

      await notifyRole({
        role: 'Facility Manager',
        type: 'WORKER_COMPLETION_SUBMITTED',
        title: 'Ticket ready for review',
        message: `Ticket #${issueId} has a worker completion update.`,
        issueId
      }, tx);

      return updatedIssue;
    });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
