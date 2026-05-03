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

    const parsedUserId = parseInt(userId, 10);
    if (Number.isNaN(parsedUserId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const user = await prisma.user.findUnique({ where: { id: parsedUserId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = (user.role || '').toLowerCase();
    if (!role.includes('community')) {
      return res.status(403).json({ error: 'Only Community Members can submit issues' });
    }

    const imagePath = req.file ? `/uploads/issues/${req.file.filename}` : null;

    const issue = await prisma.issue.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location.trim(),
        image: imagePath,
        status: 'Open',
        userId: parsedUserId
      }
    });

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};