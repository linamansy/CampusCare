const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true
});

process.chdir(__dirname);

const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all interfaces so mobile devices on same WiFi can connect

app.listen(PORT, HOST, () => {
  console.log(`CampusCare API running on http://${HOST}:${PORT}`);
  console.log(`LAN access: http://192.168.8.115:${PORT}`);
});
