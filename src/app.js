const express = require('express');
const path = require('path');

const issueRoutes = require('./routes/todoRoutes');
const managerRoutes = require('./routes/managerRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');

  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-user-id, x-userid'
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

app.use(express.json());

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

module.exports = app;