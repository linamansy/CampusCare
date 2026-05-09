const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true
});

console.log("INDEX RUNNING");

process.chdir(__dirname);

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
console.log("INDEX RUNNING");

process.chdir(__dirname);

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
