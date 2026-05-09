const jwt = require('jsonwebtoken');
const { isTokenRevoked } = require('../utils/tokenRevocationStore');

const JWT_SECRET = process.env.JWT_SECRET || 'campuscare-dev-secret-change-me';

const verifyAuth = (req, res, next) => {
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

    if (isTokenRevoked(decoded.jti)) {
      return res.status(401).json({ error: 'Authentication token revoked', code: 'TOKEN_REVOKED' });
    }

    req.user = decoded;
    req.userId = decoded.id;
    next();
  } catch (error) {
    const code = error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_AUTH';
    const message = error.name === 'TokenExpiredError'
      ? 'Authentication token expired'
      : 'Invalid authentication';

    res.status(401).json({ error: message, code });
  }
};

module.exports = { verifyAuth };
