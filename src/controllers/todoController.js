const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');
const { parsePositiveInt } = require('../utils/issueHelpers');

// GET all issues
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE issue
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location, userId } = req.body;

    if (!title || !description || !category || !location || userId == null) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const issue = await prisma.issue.create({
      data: { title, description, category, location, userId }
    });

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generic status update used by manager actions
exports.updateIssueStatus = async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const { status } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Missing status' });
  }

  try {
    const issue = await prisma.issue.update({
      where: { id },
      data: { status }
    });

    res.json(issue);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(500).json({ error: error.message });
  }
};

// Add comment. Workers may pass workerId to enforce assignment.
exports.createComment = async (req, res) => {
  const { text, issueId, workerId } = req.body;
  const parsedIssueId = parsePositiveInt(issueId);
  const parsedWorkerId = workerId == null ? null : parsePositiveInt(workerId);

  if (!text || issueId == null) {
    return res.status(400).json({ error: 'Missing text or issueId' });
  }

  if (!parsedIssueId) {
    return res.status(400).json({ error: 'Invalid issueId' });
  }

  if (workerId != null && !parsedWorkerId) {
    return res.status(400).json({ error: 'Invalid workerId' });
  }

  try {
    if (parsedWorkerId) {
      const { error } = await findIssueAssignedToWorker(parsedIssueId, parsedWorkerId);

      if (error) {
        return res.status(error.status).json({ error: error.message });
      }
    } else {
      const issue = await prisma.issue.findUnique({
        where: { id: parsedIssueId }
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
    }

    const comment = await prisma.comment.create({
      data: { text, issueId: parsedIssueId }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
