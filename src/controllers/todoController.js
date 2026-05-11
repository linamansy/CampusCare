const prisma = require('../prismaClient');
const { findIssueAssignedToWorker } = require('../services/assignedIssueService');
const { createNotification, notifyRole } = require('../services/notificationService');
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
  'Cleanliness',
  'Maintenance',
  'Infrastructure',
  'Sustainability',
  'Other'
];

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
    const parsedUserId = parsePositiveInt(req.params.userId);

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

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
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

    // Allow all roles to submit issues for now to facilitate testing
    // const role = (user.role || '').toLowerCase();
    // if (!role.includes('community')) {
    //   return res.status(403).json({
    //     error: 'Only Community Members can submit issues',
    //     code: 'INVALID_ROLE'
    //   });
    // }

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

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
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

exports.getCommentsByIssue = async (req, res) => {
  try {
    const issueId = parsePositiveInt(req.params.issueId || req.params.id);

    if (!issueId) {
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

exports.updateIssueStatus = async (req, res) => {
  const id = parsePositiveInt(req.params.id);
  const nextStatus = normalizeStatus(req.body.status);

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

exports.createComment = async (req, res) => {
  const routeIssueId = req.params.id;
  const { text, issueId = routeIssueId, workerId } = req.body;
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
      const issue = await prisma.issue.findUnique({ where: { id: parsedIssueId } });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        text: cleanText,
        issueId: parsedIssueId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
