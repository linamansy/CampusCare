const express = require('express');
const path = require('path');

const issueRoutes = require('./routes/todoRoutes');
const managerRoutes = require('./routes/managerRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes with /api prefix (as per requirements)
app.use('/api/issues', issueRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Debug routes (should be removed before production)
app.use('/debug', debugRoutes);

// Root
app.get('/', (req, res) => {
  res.send('CampusCare API running');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;