const prisma = require('../prismaClient');

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

// GET all issues
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: { user: true, comments: true },
      orderBy: { createdAt: 'desc' }
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
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

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
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        },
        verifier: { select: { id: true, name: true } }
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
      error: error.message,
      code: 'FETCH_ERROR'
    });
  }
};

// GET issues by user
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
      where: { userId: userId },
      include: { comments: true },
      orderBy: { createdAt: 'desc' }
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
    const { title, description, category, location, userId } = req.body;

    const rawUserId = req.userId ?? userId;

    if (rawUserId == null) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    const parsedUserId = parseInt(rawUserId, 10);

    if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({
        error: 'Valid userId required',
        code: 'INVALID_USER'
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Title is required',
        code: 'INVALID_TITLE'
      });
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        error: 'Title must be 100 characters or less',
        code: 'TITLE_TOO_LONG'
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Description is required',
        code: 'INVALID_DESCRIPTION'
      });
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
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

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return res.status(400).json({
        error: 'Location is required',
        code: 'INVALID_LOCATION'
      });
    }

    if (location.length > MAX_LOCATION_LENGTH) {
      return res.status(400).json({
        error: 'Location must be 200 characters or less',
        code: 'LOCATION_TOO_LONG'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const role = (user.role || '').toLowerCase();

    if (!role.includes('community')) {
      return res.status(403).json({
        error: 'Only Community Members can submit issues',
        code: 'INVALID_ROLE'
      });
    }

    const imagePath = req.file
      ? `/uploads/issues/${req.file.filename}`
      : null;

    const issue = await prisma.issue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        image: imagePath,
        status: 'Open',
        userId: parsedUserId
      }
    });

    // Create notification for Facility Managers
    const managers = await prisma.user.findMany({
      where: { role: 'Facility Manager' }
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
      message: 'Issue created successfully',
      data: issue
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

    const validStatuses = ['Open', 'In_Progress', 'Resolved', 'Verified'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Issue status updated successfully',
      data: updatedIssue
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ASSIGN worker to issue
exports.assignWorker = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);
    const { workerId } = req.body;
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

    const parsedWorkerId = parseInt(workerId, 10);
    if (Number.isNaN(parsedWorkerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const worker = await prisma.user.findUnique({
      where: { id: parsedWorkerId }
    });

    if (!worker || worker.role !== 'Worker') {
      return res.status(400).json({
        success: false,
        message: 'Invalid worker'
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: { assignedTo: parsedWorkerId, status: 'In_Progress' }
    });

    // Create notification for worker
    await prisma.notification.create({
      data: {
        userId: parsedWorkerId,
        type: 'issue_assigned',
        message: `New issue assigned: "${issue.title}"`,
        issueId: issue.id
      }
    });

    res.json({
      success: true,
      message: 'Worker assigned successfully',
      data: updatedIssue
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// CLOSE issue
exports.closeIssue = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);
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

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: 'Resolved',
        resolvedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Issue closed successfully',
      data: updatedIssue
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPLOAD photo for issue
exports.uploadIssuePhoto = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    const imagePath = `/uploads/issues/${req.file.filename}`;

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: { image: imagePath }
    });

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: updatedIssue
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE issue
exports.deleteIssue = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);
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

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    await prisma.issue.delete({
      where: { id: issueId }
    });

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET comments by issue
exports.getCommentsByIssue = async (req, res) => {
  try {
    const issueId = parseInt(req.params.issueId || req.params.id);

    if (Number.isNaN(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue id'
      });
    }

    const comments = await prisma.comment.findMany({
      where: { issueId },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: comments,
      message: 'Comments retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET notifications for user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: { issue: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// MARK notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (Number.isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification id'
      });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.verifyResolution = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);
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
        message: 'Invalid issue id'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { user: true }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Only issue creator can verify resolution
    if (issue.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the issue creator can verify resolution'
      });
    }

    if (issue.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Issue must be in Resolved status to verify'
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: 'Verified',
        resolvedAt: new Date(),
        verifiedBy: userId
      }
    });

    // Create notification for assigned worker
    if (issue.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: issue.assignedTo,
          type: 'issue_verified',
          message: `Issue "${issue.title}" has been verified as resolved`,
          issueId: issue.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Issue resolution verified successfully',
      data: updatedIssue
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
};

exports.createComment = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);
    const { text } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (Number.isNaN(issueId)) {
      return res.status(400).json({
        error: 'Invalid issue id',
        code: 'INVALID_ISSUE_ID'
      });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Comment text is required',
        code: 'INVALID_COMMENT_TEXT'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found',
        code: 'ISSUE_NOT_FOUND'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid authentication',
        code: 'INVALID_AUTH'
      });
    }

    const canComment =
      issue.userId === userId ||
      issue.assignedTo === userId ||
      user.role === 'Facility Manager';

    if (!canComment) {
      return res.status(403).json({
        error: 'You are not authorized to comment on this issue',
        code: 'COMMENT_FORBIDDEN'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        issueId: issue.id,
        userId: userId
      },
      include: { user: true }
    });

    // Create notification for issue creator if not the commenter
    if (issue.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: issue.userId,
          type: 'comment_added',
          message: `New comment on your issue "${issue.title}"`,
          issueId: issue.id
        }
      });
    }

    // Notify assigned worker if exists and not the commenter
    if (issue.assignedTo && issue.assignedTo !== userId) {
      await prisma.notification.create({
        data: {
          userId: issue.assignedTo,
          type: 'comment_added',
          message: `New comment on assigned issue "${issue.title}"`,
          issueId: issue.id
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
};
