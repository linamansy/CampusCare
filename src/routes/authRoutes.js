```javascript id="n2k7qp"
const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');

const {
  authLimiter
} = require('../middleware/rateLimiter');

const {
  verifyAuth
} = require('../middleware/auth');

// Current user
router.get(
  '/me',
  verifyAuth,
  authController.me
);

// Authentication
router.post(
  '/login',
  authLimiter,
  authController.login
);

router.post(
  '/register',
  authLimiter,
  authController.register
);

router.post(
  '/logout',
  authController.logout
);

// OTP routes
router.post(
  '/send-otp',
  authLimiter,
  authController.sendOtp
);

router.post(
  '/verify-otp',
  authLimiter,
  authController.verifyOtp
);

// Password reset
router.post(
  '/forgot-password',
  authLimiter,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  authController.resetPassword
);

module.exports = router;
```
