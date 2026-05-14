const express = require('express');
const path = require('path');
const cors = require('cors');

const issueRoutes = require('./routes/todoRoutes');
const managerRoutes = require('./routes/managerRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const debugRoutes = require('./routes/debugRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// CORS manual overrides and tunnel bypass
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-user-id, x-userid, bypass-tunnel-reminder'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Static uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// Routes
app.use('/issues', issueRoutes);
app.use('/api/issues', issueRoutes);

app.use('/manager', managerRoutes);
app.use('/api/manager', managerRoutes);

app.use('/users', userRoutes);
app.use('/api/users', userRoutes);

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

app.use('/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/debug', debugRoutes);
app.use('/api/debug', debugRoutes);

// Root
app.get('/', (req, res) => {
  res.send('CampusCare API running');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;