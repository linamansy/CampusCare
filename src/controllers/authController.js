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

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = cleanEmailValue(email);
    const selectedRole = role || 'Community Member';

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!VALID_ROLES.includes(selectedRole)) {
      return res.status(400).json({
        error: `Role must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: selectedRole
      }
    });

    res.status(201).json({
      message: 'Registration successful',
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const cleanEmail = cleanEmailValue(req.body?.email);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const otp = generateOtp();
    otpStore.set(cleanEmail, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS
    });

    res.json({
      message: 'OTP sent successfully',
      otp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const cleanEmail = cleanEmailValue(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!cleanEmail || !otp) {
      return res.status(400).json({ error: 'Email and otp are required' });
    }

    const otpEntry = otpStore.get(cleanEmail);

    if (!otpEntry) {
      return res.status(400).json({ error: 'No OTP found for this email' });
    }

    if (Date.now() > otpEntry.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (otpEntry.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    otpStore.delete(cleanEmail);
    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const cleanEmail = cleanEmailValue(req.body?.email);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.json({ message: 'If the account exists, a reset token was generated' });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    resetTokenStore.set(resetToken, {
      userId: user.id,
      expiresAt: Date.now() + RESET_TOKEN_EXPIRY_MS
    });

    res.json({
      message: 'Password reset token generated',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenEntry = resetTokenStore.get(token);

    if (!tokenEntry) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (Date.now() > tokenEntry.expiresAt) {
      resetTokenStore.delete(token);
      return res.status(400).json({ error: 'Reset token expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: tokenEntry.userId },
      data: { password: hashedPassword }
    });

    resetTokenStore.delete(token);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
