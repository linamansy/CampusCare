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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await authenticateUser(cleanEmail, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.authenticateUser = authenticateUser;
