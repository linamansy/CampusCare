const express = require('express');
const path = require('path');

const issueRoutes = require('./routes/todoRoutes');
const managerRoutes = require('./routes/managerRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/issues', issueRoutes);
app.use('/manager', managerRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
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
