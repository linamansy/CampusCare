const prisma = require('../prismaClient');

const {
  findIssueAssignedToWorker
} = require('../services/assignedIssueService');

const {
  createNotification,
  notifyRole
} = require('../services/notificationService');

const {
  normalizeLocation,
  sanitizeText,
  parsePositiveInt
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

const CLOSED_STATUSES = [
  'Resolved',
  'Rejected'
];

const issueInclude = {
  user: true,
  comments: true
};

const deriveLocationParts = ({
  building,
  floor,
  room,
  location
}) => {
  const cleanBuilding =
    sanitizeText(building);

  const cleanFloor =
    sanitizeText(floor);

  const cleanRoom =
    sanitizeText(room);

  const cleanLocation =
    normalizeLocation(
      location ||
        `${cleanBuilding} - Floor ${cleanFloor} - Room ${cleanRoom}`
    );

  return {
    cleanBuilding,
    cleanFloor,
    cleanRoom,
    cleanLocation
  };
};

// GET ALL ISSUES

exports.getAllIssues = async (
  req,
  res
) => {
  try {
    const issues =
      await prisma.issue.findMany({
        include: issueInclude,
        orderBy: {
          createdAt: 'desc'
        }
      });

    res.json({
      success: true,
      count: issues.length,
      data: issues
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ISSUE BY ID

exports.getIssueById = async (
  req,
  res
) => {
  try {
    const parsedId =
      parsePositiveInt(
        req.params.id
      );

    if (!parsedId) {
      return res.status(400).json({
        error:
          'Valid issue ID required',
        code: 'INVALID_ID'
      });
    }

    const issue =
      await prisma.issue.findUnique({
        where: {
          id: parsedId
        },
        include: issueInclude
      });

    if (!issue) {
      return res.status(404).json({
        error: 'Issue not found'
      });
    }

    res.json({
      success: true,
      data: issue
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// CREATE ISSUE

exports.createIssue = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      category,
      location,
      building,
      floor,
      room,
      userId
    } = req.body;

    const rawUserId =
      req.userId ?? userId;

    if (!rawUserId) {
      return res.status(401).json({
        error:
          'Authentication required',
        code: 'NO_AUTH'
      });
    }

    const parsedUserId =
      parsePositiveInt(
        rawUserId
      );

    if (!parsedUserId) {
      return res.status(400).json({
        error:
          'Valid userId required',
        code: 'INVALID_USER'
      });
    }

    const cleanTitle =
      sanitizeText(title);

    const cleanDescription =
      sanitizeText(description);

    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (
      cleanTitle.length >
      MAX_TITLE_LENGTH
    ) {
      return res.status(400).json({
        error:
          'Title must be 100 characters or less',
        code: 'TITLE_TOO_LONG'
      });
    }

    if (!cleanDescription) {
      return res.status(400).json({
        error:
          'Description is required',
        code:
          'INVALID_DESCRIPTION'
      });
    }

    if (
      cleanDescription.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return res.status(400).json({
        error:
          'Description must be 1000 characters or less',
        code:
          'DESCRIPTION_TOO_LONG'
      });
    }

    if (
      !category ||
      !ALLOWED_CATEGORIES.includes(
        category
      )
    ) {
      return res.status(400).json({
        error:
          'Invalid category'
      });
    }

    const {
      cleanBuilding,
      cleanFloor,
      cleanRoom,
      cleanLocation
    } = deriveLocationParts({
      building,
      floor,
      room,
      location
    });

    if (
      !cleanBuilding ||
      !cleanFloor ||
      !cleanRoom
    ) {
      return res.status(400).json({
        error:
          'Building, floor, and room are required',
        code:
          'INVALID_LOCATION_PARTS'
      });
    }

    if (
      cleanBuilding.length >
        MAX_BUILDING_LENGTH ||
      cleanFloor.length >
        MAX_FLOOR_LENGTH ||
      cleanRoom.length >
        MAX_ROOM_LENGTH
    ) {
      return res.status(400).json({
        error:
          'Building, floor, or room is too long',
        code:
          'LOCATION_PART_TOO_LONG'
      });
    }

    if (!cleanLocation) {
      return res.status(400).json({
        error:
          'Location is required',
        code:
          'INVALID_LOCATION'
      });
    }

    if (
      cleanLocation.length >
      MAX_LOCATION_LENGTH
    ) {
      return res.status(400).json({
        error:
          'Location must be 200 characters or less',
        code:
          'LOCATION_TOO_LONG'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error:
          'Issue photo is required',
        code: 'IMAGE_REQUIRED'
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: parsedUserId
        }
      });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const similarIssueCount =
      await prisma.issue.count({
        where: {
          building: {
            equals:
              cleanBuilding,
            mode:
              'insensitive'
          },
          floor: {
            equals: cleanFloor,
            mode:
              'insensitive'
          },
          room: {
            equals: cleanRoom,
            mode:
              'insensitive'
          },
          status: {
            notIn:
              CLOSED_STATUSES
          }
        }
      });

    const priority =
      similarIssueCount + 1 >=
      PRIORITY_HIGH_THRESHOLD
        ? 'High'
        : 'Normal';

    const imagePath =
      `/uploads/issues/${req.file.filename}`;

    const issue =
      await prisma.$transaction(
        async (tx) => {
          const createdIssue =
            await tx.issue.create({
              data: {
                title: cleanTitle,
                description:
                  cleanDescription,
                category,
                location:
                  cleanLocation,
                building:
                  cleanBuilding,
                floor: cleanFloor,
                room: cleanRoom,
                image: imagePath,
                status:
                  'Submitted/Pending',
                priority,
                userId:
                  parsedUserId
              }
            });

          await tx.user.update({
            where: {
              id: parsedUserId
            },
            data: {
              actsOfServicePoints:
                {
                  increment:
                    ISSUE_REPORT_POINTS
                }
            }
          });

          return createdIssue;
        }
      );

    await notifyRole({
      role:
        'Facility Manager',

      type:
        'ISSUE_CREATED',

      title:
        'New issue submitted',

      message:
        `Issue "${cleanTitle}" was submitted.`,

      issueId: issue.id
    });

    res.status(201).json({
      success: true,
      message:
        'Issue created successfully',
      pointsAwarded:
        ISSUE_REPORT_POINTS,
      data: issue
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
};