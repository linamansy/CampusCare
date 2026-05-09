const express = require('express');
const router = express.Router();

const controller = require('../controllers/authController');
const { verifyAuth } = require('../middleware/auth');

router.get('/me', verifyAuth, controller.me);
router.post('/register', controller.register);
router.post('/send-otp', controller.sendOtp);
router.post('/verify-otp', controller.verifyOtp);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

router.post('/login', controller.login);
router.post('/logout', controller.logout);

module.exports = router;

