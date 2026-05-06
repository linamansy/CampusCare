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

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required', code: 'INVALID_TITLE' });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: 'Title must be 100 characters or less', code: 'TITLE_TOO_LONG' });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required', code: 'INVALID_DESCRIPTION' });
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({ error: 'Description must be 1000 characters or less', code: 'DESCRIPTION_TOO_LONG' });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        code: 'INVALID_CATEGORY'
      });
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return res.status(400).json({ error: 'Location is required', code: 'INVALID_LOCATION' });
    }
    if (location.length > MAX_LOCATION_LENGTH) {
      return res.status(400).json({ error: 'Location must be 200 characters or less', code: 'LOCATION_TOO_LONG' });
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

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: issue
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'INTERNAL_ERROR' });
  }
};

// GET issues for specific user
exports.getUserIssues = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    const { status } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
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
