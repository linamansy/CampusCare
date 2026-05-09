const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');

const VALID_ROLES = ['Community Member', 'Facility Manager', 'Worker', 'Admin'];

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanRole = typeof role === 'string' ? role.trim() : '';

    if (!cleanName || !cleanEmail || !password || !cleanRole) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!VALID_ROLES.includes(cleanRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        allowedRoles: VALID_ROLES
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: cleanRole
      }
    });

    const { password: _password, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
