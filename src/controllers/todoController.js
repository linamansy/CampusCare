

const prisma = require('../prismaClient');

// GET all issues
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        user: true,
        comments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: issues.length,
      data: issues
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET issue by id
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        error: 'Valid issue ID required',
        code: 'INVALID_ID'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: parsedId },
      include: {
        user: true,
        comments: true
      }
    });

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({ success: true, data: issue });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET issues by user
exports.getMyIssues = async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);
    const authUserId = req.userId;

    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({
        error: 'Valid userId required',
        code: 'INVALID_USER_ID'
      });
    }

    if (authUserId && authUserId !== parsedUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'USER_ID_MISMATCH'
      });
    }

    const issues = await prisma.issue.findMany({
      where: { userId: parsedUserId },
      include: { comments: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: issues.length,
      data: issues
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET issues for specific user
exports.getUserIssues = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    const { status } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    const where = { userId };

    if (status) {
      where.status = status;
    }

    const issues = await prisma.issue.findMany({
      where
    });

    res.json(issues);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET comments by issue
exports.getCommentsByIssue = async (req, res) => {
  try {
    const issueId = parseInt(req.params.issueId || req.params.id);

    if (Number.isNaN(issueId)) {
      return res.status(400).json({
        error: 'Invalid issue id'
      });
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

// CREATE issue
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    const userId = req.userId || (req.user && req.user.id);

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        error: 'Title, description, category, and location are required'
      });
    }
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required to create issue'
      });
    }

    const image = req.file ? `/uploads/issues/${req.file.filename}` : null;

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        category,
        location,
        image,
        userId
      },
      include: {
        user: true
      }
    });

    res.status(201).json({
      success: true,
      data: issue
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE comment
exports.createComment = async (req, res) => {
  try {
    const { text, issueId: bodyIssueId } = req.body;
    const issueId = parseInt(req.params.id || bodyIssueId, 10);

    if (!text || Number.isNaN(issueId)) {
      return res.status(400).json({
        error: 'Text and issueId are required'
      });
    }

    // Verify issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        issueId
      }
    });

    res.status(201).json({
      success: true,
      data: comment
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE issue status
exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const parsedId = parseInt(id, 10);

    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        error: 'Valid issue ID required'
      });
    }

    const validStatuses = ['Open', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const issue = await prisma.issue.update({
      where: { id: parsedId },
      data: { status },
      include: {
        user: true,
        comments: true
      }
    });

    res.json({
      success: true,
      data: issue
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }
    res.status(500).json({ error: error.message });
  }
};