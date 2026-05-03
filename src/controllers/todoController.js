const prisma = require('../prismaClient');

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
// 🔹 Get assigned issues
exports.getAssignedIssues = async (req, res) => {
  console.log('[ROUTE] GET /issues/assigned', req.query);
  const { workerId } = req.query;

  try {
    const issues = await prisma.issue.findMany({
      where: { assignedTo: parseInt(workerId) }
    });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Update issue status
exports.updateIssueStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

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

// 🔹 Add comment
exports.createComment = async (req, res) => {
  const { text, issueId } = req.body;

  if (!text || issueId == null) {
    return res.status(400).json({ error: 'Missing text or issueId' });
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: parseInt(issueId) }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const comment = await prisma.comment.create({
      data: { text, issueId: parseInt(issueId) }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};