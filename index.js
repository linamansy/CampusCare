
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('INDEX RUNNING');

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
