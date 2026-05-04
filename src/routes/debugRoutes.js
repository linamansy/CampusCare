const express = require('express');
const router = express.Router();

const prisma = require('../prismaClient');
const { authenticateUser } = require('../controllers/authController');

const TEST_USER = {
  name: 'Lina',
  email: 'lina@test.com',
  password: '123456',
  role: 'Community Member'
};

router.get('/test-login', async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });

    const user = existingUser || await prisma.user.create({
      data: TEST_USER
    });

    const loggedInUser = await authenticateUser(TEST_USER.email, TEST_USER.password);

    res.json({
      userCreated: !existingUser,
      loginSucceeded: Boolean(loggedInUser),
      message: loggedInUser ? 'Debug login test passed' : 'Debug login test failed',
      user: loggedInUser || {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
