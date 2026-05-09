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

// GET issues for specific user
exports.getUserIssues = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const where = { userId };

    if (status) {
      where.status = status;
    }

    const issues = await prisma.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(issues);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE issue
exports.deleteIssue = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const issue = await prisma.issue.findUnique({
      where: { id }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({
        where: { issueId: id }
      });

      await tx.issue.delete({
        where: { id }
      });
    });

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
