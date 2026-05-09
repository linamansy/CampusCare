const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = cleanEmailValue(email);
    const cleanRole = typeof role === 'string' ? role.trim() : '';

    if (!cleanName || !cleanEmail || !password || !cleanRole) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (typeof password !== 'string' || password.length < 6) {
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

    res.status(201).json({
      message: 'User registered successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const cleanEmail = cleanEmailValue(req.body.email);

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOtp();
    otpStore.set(cleanEmail, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS
    });

    res.json({
      message: 'OTP generated successfully',
      otp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const cleanEmail = cleanEmailValue(req.body.email);
    const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';

    if (!cleanEmail || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const savedOtp = otpStore.get(cleanEmail);

    if (!savedOtp || savedOtp.expiresAt < Date.now()) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP is invalid or expired' });
    }

    if (savedOtp.otp !== otp) {
      return res.status(400).json({ error: 'OTP is invalid or expired' });
    }

    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { isVerified: true }
    });

    otpStore.delete(cleanEmail);

    res.json({
      message: 'Account verified successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const cleanEmail = cleanEmailValue(req.body.email);

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    resetTokenStore.set(cleanEmail, {
      resetToken,
      expiresAt: Date.now() + RESET_TOKEN_EXPIRY_MS
    });

    res.json({
      message: 'Password reset token generated successfully',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const cleanEmail = cleanEmailValue(req.body.email);
    const resetToken = typeof req.body.resetToken === 'string'
      ? req.body.resetToken.trim()
      : '';
    const { newPassword } = req.body;

    if (!cleanEmail || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, resetToken, and newPassword are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const savedToken = resetTokenStore.get(cleanEmail);

    if (!savedToken || savedToken.expiresAt < Date.now()) {
      resetTokenStore.delete(cleanEmail);
      return res.status(400).json({ error: 'Reset token is invalid or expired' });
    }

    if (savedToken.resetToken !== resetToken) {
      return res.status(400).json({ error: 'Reset token is invalid or expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { password: hashedPassword }
    });

    resetTokenStore.delete(cleanEmail);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(500).json({ error: error.message });
  }
};

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
