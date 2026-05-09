const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');
const {
  ALLOWED_STATUSES,
  isAllowedStatus,
  isValidStatusTransition,
  normalizeLocation,
  normalizeStatus,
  parsePositiveInt,
  sanitizeText
} = require('../utils/issueHelpers');

const ALLOWED_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Cleaning',
  'Maintenance',
  'Other'
];

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_LOCATION_LENGTH = 200;
const PRIORITY_HIGH_THRESHOLD = 1;
const CLOSED_STATUSES = ['Resolved', 'Rejected'];

// GET all issues
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: { user: true, comments: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
  }
};

// GET issue by id
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return res.status(400).json({ error: 'Valid issue ID required', code: 'INVALID_ID' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: parsedId },
      include: { user: true, comments: true }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
  }
};

// GET issues by user
exports.getMyIssues = async (req, res) => {
  try {
    const { userId } = req.params;
    const parsedUserId = parseInt(userId, 10);
    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({ error: 'Valid userId required', code: 'INVALID_USER_ID' });
    }

    const issues = await prisma.issue.findMany({
      where: { userId: parsedUserId },
      include: { comments: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
  }
};

// CREATE issue
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location, userId } = req.body;
    const rawUserId = req.userId ?? userId;

    if (rawUserId == null) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_AUTH' });
    }

    const parsedUserId = parseInt(rawUserId, 10);
    if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ error: 'Valid userId required', code: 'INVALID_USER' });
    }

    const cleanTitle = sanitizeText(title);

    if (!cleanTitle) {
      return res.status(400).json({
        error: 'Title is required',
        code: 'INVALID_TITLE'
      });
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        error: 'Title must be 100 characters or less',
        code: 'TITLE_TOO_LONG'
      });
    }

    const cleanDescription = sanitizeText(description);

    if (!cleanDescription) {
      return res.status(400).json({
        error: 'Description is required',
        code: 'INVALID_DESCRIPTION'
      });
    }

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        error: 'Description must be 1000 characters or less',
        code: 'DESCRIPTION_TOO_LONG'
      });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        code: 'INVALID_CATEGORY'
      });
    }

    const cleanLocation = normalizeLocation(location);

    if (!cleanLocation) {
      return res.status(400).json({
        error: 'Location is required',
        code: 'INVALID_LOCATION'
      });
    }

    if (cleanLocation.length > MAX_LOCATION_LENGTH) {
      return res.status(400).json({
        error: 'Location must be 200 characters or less',
        code: 'LOCATION_TOO_LONG'
      });
    }

    const user = await prisma.user.findUnique({ where: { id: parsedUserId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const role = (user.role || '').toLowerCase();
    if (!role.includes('community')) {
      return res.status(403).json({ error: 'Only Community Members can submit issues', code: 'INVALID_ROLE' });
    }

    const imagePath = req.file ? `/uploads/issues/${req.file.filename}` : null;

    const similarIssueCount = await prisma.issue.count({
      where: {
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
            res.status(500).json({
              error: error.message
            });
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
            res.status(500).json({
              error: error.message
            });
          }
        };

        // Generic status update used by manager actions
        exports.updateIssueStatus = async (req, res) => {
          const id = parsePositiveInt(req.params.id);
          const { status } = req.body;

          if (!id) {
            return res.status(400).json({ error: 'Invalid issue id' });
          }

          const nextStatus = normalizeStatus(status);

          if (!nextStatus) {
            return res.status(400).json({ error: 'Missing status' });
          }

          if (!isAllowedStatus(nextStatus)) {
            return res.status(400).json({
              error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
            });
          }

          try {
            const currentIssue = await prisma.issue.findUnique({
              where: { id },
              select: { status: true }
            });

            if (!currentIssue) {
              return res.status(404).json({ error: 'Issue not found' });
            }

            if (!isValidStatusTransition(currentIssue.status, nextStatus)) {
              return res.status(409).json({
                error: `Invalid status transition from ${currentIssue.status} to ${nextStatus}`
              });
            }

            const issue = await prisma.issue.update({
              where: { id },
              data: { status: nextStatus }
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

          const cleanText = sanitizeText(text);

          if (!cleanText || issueId == null) {
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
              data: { text: cleanText, issueId: parsedIssueId }
            });

            res.status(201).json(comment);
          } catch (error) {
            res.status(500).json({ error: error.message });
          }
        };
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
      data: { text: cleanText, issueId: parsedIssueId }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};