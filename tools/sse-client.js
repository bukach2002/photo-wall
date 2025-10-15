const http = require('http');
const fs = require('fs');

const out = fs.createWriteStream('.\\sse.log', { flags: 'a' });

const req = http.get('http://localhost:3000/api/stream', (res) => {
  res.on('data', (chunk) => {
    out.write(chunk);
  });
  res.on('end', () => {
    console.log('SSE connection ended');
    out.end();
  });
});
req.on('error', (e) => console.error('SSE client error', e));

// keep process alive
setInterval(() => {}, 1000);
