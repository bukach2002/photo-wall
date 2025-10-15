const http = require('http');
const fs = require('fs');

const outPath = '.\\sse.log';
const out = fs.createWriteStream(outPath, { flags: 'a' });

function start() {
  const req = http.get('http://localhost:3000/api/stream', (res) => {
    res.setEncoding('utf8');
    let buffer = '';
    res.on('data', (chunk) => {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        // parse each event block
        const lines = raw.split(/\r?\n/);
        let data = '';
        for (const line of lines) {
          if (!line) continue;
          if (line.startsWith(':')) {
            // comment/ping
            // ignore
            continue;
          }
          if (line.startsWith('data:')) {
            data += line.slice(5).trim() + '\n';
          }
        }
        if (data) {
          // write data (trim trailing newline)
          out.write(data.trim() + '\n');
          console.log('[sse-client-parser] message:', data.trim());
        }
      }
    });
    res.on('end', () => {
      console.log('SSE connection ended');
      out.end();
    });
  });
  req.on('error', (e) => console.error('SSE client error', e));
}

start();
setInterval(() => {}, 1000);
