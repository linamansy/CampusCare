const express = require('express');

const issueRoutes = require('./routes/todoRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();

app.use(express.json());

// Routes
app.use('/issues', issueRoutes);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/debug', debugRoutes);

// Root
app.get('/', (req, res) => {
  res.send('CampusCare API running');
});

module.exports = app;
