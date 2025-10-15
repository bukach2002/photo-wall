const http = require('http');
const fs = require('fs');
const outPath = '.\\sse.raw.log';
const out = fs.createWriteStream(outPath, { flags: 'a' });

const req = http.get('http://localhost:3000/api/stream', (res) => {
  res.on('data', (chunk) => {
    const ts = new Date().toISOString();
    const text = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    out.write(`----- ${ts} -----\n`);
    out.write(text + '\n');
    console.log('[sse-debug] chunk:', text.replace(/\n/g, '\\n'));
  });
  res.on('end', () => {
    console.log('SSE connection ended');
    out.end();
  });
});
req.on('error', (e) => console.error('SSE debug client error', e));
setInterval(() => {}, 1000);
