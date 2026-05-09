const prisma = require('../prismaClient');

const authenticateUser = async (email, password) => {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });

  if (!user || user.password !== password) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanRole = typeof role === 'string' ? role.trim() : '';

    if (!cleanName || !cleanEmail || !password || !cleanRole) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const VALID_ROLES = ['Community Member', 'Facility Manager', 'Worker'];
    if (!VALID_ROLES.includes(cleanRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
        allowedRoles: VALID_ROLES
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password,
        role: cleanRole
      }
    });

    const { password: _password, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await authenticateUser(cleanEmail, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.logout = async (req, res) => {
  // For stateless JWT, logout is handled on client side
  // In a session-based system, you'd destroy the session here
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

exports.authenticateUser = authenticateUser;
