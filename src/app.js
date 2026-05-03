const express = require('express');

const issueRoutes = require('./routes/todoRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());

// Routes
app.use('/issues', issueRoutes);
app.use('/users', userRoutes);

// Root
app.get('/', (req, res) => {
  res.send('CampusCare API running');
});

module.exports = app;