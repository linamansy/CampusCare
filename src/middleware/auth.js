const verifyAuth = (req, res, next) => {
  try {
    const bodyUserId = req.body && req.body.userId ? req.body.userId : null;
    const headerValue = req.headers['x-user-id'] ?? req.headers['x-userid'];
    const headerUserId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const queryUserId = req.query && req.query.userId ? req.query.userId : null;
    const userId = bodyUserId || headerUserId || queryUserId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_AUTH' });
    }

    const parsedUserId = parseInt(String(userId).trim(), 10);
    if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
      console.warn('Auth failed:', {
        bodyUserId,
        headerUserId,
        queryUserId,
        rawUserId: userId
      });
      return res.status(401).json({ error: 'Invalid authentication', code: 'INVALID_AUTH' });
    }

    req.userId = parsedUserId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication', code: 'INVALID_AUTH' });
  }
};

module.exports = { verifyAuth };
