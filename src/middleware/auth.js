const verifyAuth = (req, res, next) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required', code: 'NO_AUTH' });
    }

    const parsedUserId = parseInt(userId, 10);
    if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
      return res.status(401).json({ error: 'Invalid authentication', code: 'INVALID_AUTH' });
    }

    req.userId = parsedUserId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication', code: 'INVALID_AUTH' });
  }
};

module.exports = { verifyAuth };
