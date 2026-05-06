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

exports.getIssueById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid issue id' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        comments: {
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCommentsByIssue = async (req, res) => {
  try {
    const issueId = parseInt(req.params.issueId || req.params.id);

    if (Number.isNaN(issueId)) {
      return res.status(400).json({ error: 'Invalid issue id' });
    }

    const comments = await prisma.comment.findMany({
      where: { issueId },
      orderBy: { id: 'asc' }
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const { text } = req.body;

    if (Number.isNaN(issueId) || !text?.trim()) {
      return res.status(400).json({ error: 'Missing issueId or text' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const comment = await prisma.comment.create({
      data: { text: text.trim(), issueId }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};