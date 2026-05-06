<<<<<<< Updated upstream

require('dotenv').config();console.log("INDEX RUNNING");
=======
require('dotenv').config();
console.log("INDEX RUNNING");
>>>>>>> Stashed changes

process.chdir(__dirname);

const app = require('./src/app'); 

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
require('dotenv').config({ path: __dirname + '/.env' });
