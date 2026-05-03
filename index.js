console.log("INDEX RUNNING");

process.chdir(__dirname);

const app = require('./src/app'); // 🔥 MUST be exactly this

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});