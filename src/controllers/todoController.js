} catch (error) {
  next(error);
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
    next(error);
  }
};

// GET issues by user
exports.getMyIssues = async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);

    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({
        error: 'Valid userId required',
        code: 'INVALID_USER_ID'
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
    next(error);
  }
};
} catch (error) {
  next(error);
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
    next(error);
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
    next(error);
  }
};