const http = require('http');

const url = 'http://localhost:3000/health';
const timeoutMs = 3000;

const request = http.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Health check failed: ${res.statusCode}`);
    process.exit(1);
    return;
  }

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`Health check OK: ${body || 'no body'}`);
    process.exit(0);
  });
});

request.on('error', (err) => {
  console.error(`Health check error: ${err.message}`);
  process.exit(1);
});

request.setTimeout(timeoutMs, () => {
  console.error('Health check timed out');
  request.destroy();
  process.exit(1);
});
