const { MulterError } = require('multer');

module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error('API Error:', err);

  let status = 500;
  let message = err.message || 'Server error';

  if (err instanceof MulterError) {
    status = 400;
  } else if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    status = 401;
  } else if (err.code === 'P2002') {
    status = 400;
    message = 'Duplicate resource';
  } else if (err.code === 'P2025') {
    status = 404;
    message = 'Record not found';
  } else if (err.code && typeof err.code === 'string' && err.code.startsWith('P2')) {
    status = 400;
  }

  return res.status(status).json({ success: false, error: message });
};