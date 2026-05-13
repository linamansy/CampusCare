const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');
const { createNotification, notifyRole } = require('../services/notificationService');
const { DEFAULT_CATEGORIES, getCategories } = require('../services/categoryService');
const {
  ALLOWED_STATUSES,
  isAllowedStatus,
  isValidStatusTransition,
  normalizeLocation,
  normalizeStatus,
  parsePositiveInt,
  sanitizeText
} = require('../utils/issueHelpers');

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_LOCATION_LENGTH = 200;
const MAX_BUILDING_LENGTH = 100;
const MAX_FLOOR_LENGTH = 50;
const MAX_ROOM_LENGTH = 50;
const PRIORITY_HIGH_THRESHOLD = 3;
const ISSUE_REPORT_POINTS = 10;
const CLOSED_STATUSES = ['Resolved', 'Rejected'];

const issueInclude = { user: true, comments: true };

const MANAGER_ROLES = new Set(['Facility Manager', 'Admin']);

const hasManagerAccess = (role) => MANAGER_ROLES.has(role);

const getCurrentRole = (req) => {
  return typeof req.user?.role === 'string' ? req.user.role : '';
};

const deriveLocationParts = ({ building, floor, room, location }) => {
  const cleanBuilding = sanitizeText(building);
  const cleanFloor = sanitizeText(floor);
  const cleanRoom = sanitizeText(room);
  const cleanLocation = normalizeLocation(
    location || `${cleanBuilding} - Floor ${cleanFloor} - Room ${cleanRoom}`
  );

  return {
    cleanBuilding,
    cleanFloor,
    cleanRoom,
    cleanLocation
  };
};

exports.getAllIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: issueInclude,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
  }
};

exports.getIssueById = async (req, res) => {
  try {
    const parsedId = parsePositiveInt(req.params.id);

    if (!parsedId) {
      return res.status(400).json({
        error: 'Valid issue ID required',
        code: 'INVALID_ID'
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: parsedId },
      include: issueInclude
    });

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
  }
};

exports.getMyIssues = async (req, res) => {
  try {
    const parsedUserId =
      parsePositiveInt(req.params.userId) ||
      parsePositiveInt(req.userId);

    if (!parsedUserId) {
      return res.status(400).json({
        error: 'Valid userId required',
        code: 'INVALID_USER_ID'
      });
    }

    if (req.userId !== parsedUserId && req.user?.role !== 'Admin') {
      return res.status(403).json({
        error: 'You can only view your own tickets',
        code: 'FORBIDDEN'
      });
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

exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location, building, floor, room, userId } = req.body;
    const rawUserId = req.userId ?? userId;
    const allowedCategories = await getCategories().catch(() => DEFAULT_CATEGORIES);

    if (rawUserId == null) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_AUTH' });
    }

    const parsedUserId = parsePositiveInt(rawUserId);

    if (!parsedUserId) {
      return res.status(400).json({ error: 'Valid userId required', code: 'INVALID_USER' });
    }

    const cleanTitle = sanitizeText(title);

    if (!cleanTitle) {
      return res.status(400).json({ error: 'Title is required', code: 'INVALID_TITLE' });
    }

    if (cleanTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: 'Title must be 100 characters or less', code: 'TITLE_TOO_LONG' });
    }

    const cleanDescription = sanitizeText(description);

    if (!cleanDescription) {
      return res.status(400).json({ error: 'Description is required', code: 'INVALID_DESCRIPTION' });
    }

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({ error: 'Description must be 1000 characters or less', code: 'DESCRIPTION_TOO_LONG' });
    }

    if (!category || !allowedCategories.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${allowedCategories.join(', ')}`,
        code: 'INVALID_CATEGORY'
      });
    }

    const { cleanBuilding, cleanFloor, cleanRoom, cleanLocation } = deriveLocationParts({
      building,
      floor,
      room,
      location
    });

    if (!cleanBuilding || !cleanFloor || !cleanRoom) {
      return res.status(400).json({
        error: 'Building, floor, and room are required',
        code: 'INVALID_LOCATION_PARTS'
      });
    }

    if (
      cleanBuilding.length > MAX_BUILDING_LENGTH ||
      cleanFloor.length > MAX_FLOOR_LENGTH ||
      cleanRoom.length > MAX_ROOM_LENGTH
    ) {
      return res.status(400).json({
        error: 'Building, floor, or room is too long',
        code: 'LOCATION_PART_TOO_LONG'
      });
    }

    if (!cleanLocation) {
      return res.status(400).json({ error: 'Location is required', code: 'INVALID_LOCATION' });
    }

    if (cleanLocation.length > MAX_LOCATION_LENGTH) {
      return res.status(400).json({ error: 'Location must be 200 characters or less', code: 'LOCATION_TOO_LONG' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Issue photo is required', code: 'IMAGE_REQUIRED' });
    }

    const user = await prisma.user.findUnique({ where: { id: parsedUserId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'User account is inactive', code: 'ACCOUNT_INACTIVE' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ error: 'Account is not verified', code: 'ACCOUNT_NOT_VERIFIED' });
    }

    const role = (user.role || '').toLowerCase();

    if (!role.includes('community')) {
      return res.status(403).json({
        error: 'Only Community Members can submit issues',
        code: 'INVALID_ROLE'
      });
    }

    const similarIssueCount = await prisma.issue.count({
      where: {
        building: { equals: cleanBuilding, mode: 'insensitive' },
        floor: { equals: cleanFloor, mode: 'insensitive' },
        room: { equals: cleanRoom, mode: 'insensitive' },
        status: { notIn: CLOSED_STATUSES }
      }
    });

    const priority = similarIssueCount + 1 >= PRIORITY_HIGH_THRESHOLD ? 'High' : 'Normal';
    const imagePath = `/uploads/issues/${req.file.filename}`;

    const issue = await prisma.$transaction(async (tx) => {
      const createdIssue = await tx.issue.create({
        data: {
          title: cleanTitle,
          description: cleanDescription,
          category,
          location: cleanLocation,
          building: cleanBuilding,
          floor: cleanFloor,
          room: cleanRoom,
          image: imagePath,
          status: 'Submitted/Pending',
          priority,
          userId: parsedUserId
        }
      });

      await tx.user.update({
        where: { id: parsedUserId },
        data: { actsOfServicePoints: { increment: ISSUE_REPORT_POINTS } }
      });

      await createNotification({
        userId: parsedUserId,
        type: 'ISSUE_SUBMITTED',
        title: 'Ticket submitted',
        message: `Your ticket #${createdIssue.id} was submitted successfully.`,
        issueId: createdIssue.id
      }, tx);

      await notifyRole({
        role: 'Facility Manager',
        type: 'ISSUE_SUBMITTED',
        title: 'New ticket submitted',
        message: `Ticket #${createdIssue.id} needs review and assignment.`,
        issueId: createdIssue.id
      }, tx);

      return createdIssue;
    });

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      pointsAwarded: ISSUE_REPORT_POINTS,
      data: issue
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
};

exports.getUserIssues = async (req, res) => {
  try {
    const userId = parsePositiveInt(req.query.userId);
    const { status } = req.query;
    const currentUserId = parsePositiveInt(req.userId);
    const currentRole = getCurrentRole(req);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (currentUserId !== userId && !hasManagerAccess(currentRole)) {
      return res.status(403).json({
        error: 'You can only view your own issues',
        code: 'FORBIDDEN'
      });
    }

    const where = { userId };

    if (status) {
      where.status = status;
    }

    const issues = await prisma.issue.findMany({ where, include: { comments: true } });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE issue status
exports.updateIssueStatus = async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const nextStatus = normalizeStatus(req.body.status);
  const currentRole = getCurrentRole(req);

  if (!id) {
    return res.status(400).json({ error: 'Invalid issue id' });
  }

  if (!nextStatus) {
    return res.status(400).json({ error: 'Missing status' });
  }

  if (!isAllowedStatus(nextStatus)) {
    return res.status(400).json({
      error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
    });
  }

  if (!hasManagerAccess(currentRole)) {
    return res.status(403).json({
      error: 'Only Facility Managers or Admins can update issue status through this endpoint',
      code: 'FORBIDDEN'
    });
  }

  try {
    const currentIssue = await prisma.issue.findUnique({
      where: { id },
      select: { status: true, userId: true }
    });

    if (!currentIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (!isValidStatusTransition(currentIssue.status, nextStatus)) {
      return res.status(409).json({
        error: `Invalid status transition from ${currentIssue.status} to ${nextStatus}`
      });
    }

    const issue = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.issue.update({
        where: { id },
        data: { status: nextStatus },
        include: issueInclude
      });

      await createNotification({
        userId: currentIssue.userId,
        type: 'STATUS_CHANGED',
        title: 'Ticket status changed',
        message: `Ticket #${id} is now ${nextStatus}.`,
        issueId: id
      }, tx);

      return updatedIssue;
    });

    res.json(issue);
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.status(500).json({ error: error.message });
  }
};

// ASSIGN worker to issue
exports.assignWorker = async (req, res) => {
  try {
    const issueId = parseInt(req.params.id, 10);
    const { workerId } = req.body;
    const userId = req.userId;
    const currentRole = getCurrentRole(req);

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

    if (!hasManagerAccess(currentRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only Facility Managers or Admins can assign workers'
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
      data: { assignedTo: parsedWorkerId, status: 'Assigned' }
    });

    // Create notification for worker
    await prisma.notification.create({
      data: {
        userId: parsedWorkerId,
        type: 'issue_assigned',
        title: 'Issue assigned',
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
    const currentRole = getCurrentRole(req);

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

    if (!hasManagerAccess(currentRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only Facility Managers or Admins can resolve issues'
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

    if (!isValidStatusTransition(issue.status, 'Resolved')) {
      return res.status(409).json({
        success: false,
        message: `Invalid status transition from ${issue.status} to Resolved`
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
    const currentRole = getCurrentRole(req);

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

    const canUpdatePhoto =
      issue.userId === userId || hasManagerAccess(currentRole);

    if (!canUpdatePhoto) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this issue photo'
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
    const currentRole = getCurrentRole(req);

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

    const canDelete =
      issue.userId === userId || hasManagerAccess(currentRole);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this issue'
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
      data: { isRead: true }
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
        verifiedBy: userId
      }
    });

    // Create notification for assigned worker
    if (issue.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: issue.assignedTo,
          type: 'issue_verified',
          title: 'Issue verified',
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
    const issueId =
      parsePositiveInt(req.params.id) ||
      parsePositiveInt(req.body?.issueId);
    const { text } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!issueId) {
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
      user.role === 'Facility Manager' ||
      user.role === 'Worker' ||
      user.role === 'Admin';

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
          title: 'New comment',
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
          title: 'New comment',
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
