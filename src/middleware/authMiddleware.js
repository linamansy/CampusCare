const jwt = require('jsonwebtoken');

// Must match src/middleware/auth.js and authController JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'campuscare-dev-secret-change-me';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    req.userId = payload.id;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  return next();
};

module.exports = {
  authenticateToken,
  requireRole
};