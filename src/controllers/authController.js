const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { randomUUID } = require('crypto');
const { revokeToken } = require('../utils/tokenRevocationStore');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_SECRET = process.env.JWT_SECRET || 'campuscare-dev-secret-change-me';

const VALID_ROLES = ['Community Member', 'Facility Manager', 'Worker'];
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;

const otpStore = new Map();
const resetTokenStore = new Map();

const sanitizeUser = (user) => {
  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const cleanEmailValue = (email) => (
  typeof email === 'string' ? email.trim().toLowerCase() : ''
);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const isHashedPassword = (password) => /^\$2[aby]\$/.test(password);

const buildTokenPayload = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role
});

const generateAccessToken = (user) =>
  jwt.sign(
    {
      ...buildTokenPayload(user),
      jti: randomUUID()
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

const authenticateUser = async (email, password) => {
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });

  if (!user) {
    return null;
  }

  const passwordMatches = isHashedPassword(user.password)
    ? await bcrypt.compare(password, user.password)
    : user.password === password;

  if (!passwordMatches) {
    return null;
  }

  if (!isHashedPassword(user.password)) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
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
      user,
      accessToken: generateAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_AUTH' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authentication', code: 'INVALID_AUTH' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    revokeToken(decoded.jti, decoded.exp);

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_AUTH';
    const message = error.name === 'TokenExpiredError'
      ? 'Authentication token expired'
      : 'Invalid authentication';

    res.status(401).json({ error: message, code });
  }
};

exports.authenticateUser = authenticateUser;
exports.generateAccessToken = generateAccessToken;
