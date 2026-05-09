const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');

const {
  normalizeLocation,
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

const CLOSED_STATUSES = [
  'Resolved',
  'Rejected'
];

// GET all issues
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        user: true,
        comments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: issues,
      message: 'Issues retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET issue by id
exports.getIssueById = async (req, res) => {
  try {
    const parsedId = parseInt(req.params.id, 10);

    if (Number.isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid issue ID required'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: parsedId },

      include: {
        user: true,

        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },

          orderBy: {
            createdAt: 'asc'
          }
        },

        verifier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.json({
      success: true,
      data: issue,
      message: 'Issue retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET my issues
exports.getMyIssues = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const issues = await prisma.issue.findMany({
      where: {
        userId
      },

      include: {
        comments: true
      },

      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: issues,
      message: 'Issues retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// CREATE issue
exports.createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      userId
    } = req.body;

    const rawUserId = req.userId ?? userId;

    if (!rawUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const parsedUserId = parseInt(rawUserId, 10);

    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const cleanTitle = sanitizeText(title);

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Title too long'
      });
    }

    const cleanDescription = sanitizeText(description);

    if (!cleanDescription) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Description too long'
      });
    }

    if (
      !category ||
      !ALLOWED_CATEGORIES.includes(category)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const cleanLocation = normalizeLocation(location);

    if (!cleanLocation) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    if (cleanLocation.length > MAX_LOCATION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Location too long'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parsedUserId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const imagePath = req.file
      ? `/uploads/issues/${req.file.filename}`
      : null;

    const similarIssueCount =
      await prisma.issue.count({
        where: {
          location: {
            equals: cleanLocation,
            mode: 'insensitive'
          },

          status: {
            notIn: CLOSED_STATUSES
          }
        }
      });

    const priority =
      similarIssueCount >= PRIORITY_HIGH_THRESHOLD
        ? 'High'
        : 'Normal';

    const issue = await prisma.issue.create({
      data: {
        title: cleanTitle,
        description: cleanDescription,
        category,
        location: cleanLocation,
        image: imagePath,
        priority,
        status: 'Submitted/Pending',
        userId: parsedUserId
      }
    });

    const managers = await prisma.user.findMany({
      where: {
        role: 'Facility Manager'
      }
    });

    for (const manager of managers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          type: 'issue_created',
          message: `New issue submitted: "${issue.title}"`,
          issueId: issue.id
        }
      });
    }

    res.status(201).json({
      success: true,
      data: issue,
      message: 'Issue created successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE issue status
exports.updateIssueStatus = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);

    const { status } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (Number.isNaN(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const validStatuses = [
      'Open',
      'In_Progress',
      'Resolved',
      'Verified'
    ];

    if (
      !status ||
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId
      }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const updatedIssue =
      await prisma.issue.update({
        where: {
          id: issueId
        },

        data: {
          status
        }
      });

    res.json({
      success: true,
      data: updatedIssue,
      message: 'Issue status updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};