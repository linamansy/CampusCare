const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const userController = require('./userController');

const JWT_SECRET = process.env.JWT_SECRET || 'campuscare-secret';
const JWT_OPTIONS = { expiresIn: '2h' };

exports.register = userController.createUser;

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Missing email or password' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, JWT_OPTIONS);

    return res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role, points: user.points } });
  } catch (error) {
    return next(error);
  }
};
