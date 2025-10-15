const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public', 'test-upload.svg');
if (!fs.existsSync(filePath)) {
  console.error('Test file not found:', filePath);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);
const boundary = '----node-multipart-' + Date.now();

function fieldPart(name, value) {
  return Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`);
}

function filePart(fieldName, filename, buffer, contentType = 'image/svg+xml') {
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
    buffer,
    Buffer.from('\r\n')
  ]);
}

const endBuffer = Buffer.from(`--${boundary}--\r\n`);

const parts = [];
parts.push(fieldPart('name', 'Test User'));
parts.push(fieldPart('email', 'test@example.com'));
parts.push(fieldPart('consent', 'yes'));
parts.push(fieldPart('captions', 'Test upload'));
parts.push(filePart('photos', 'file.svg', fileBuffer));
parts.push(endBuffer);

const body = Buffer.concat(parts);

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length,
  },
}, (res) => {
  let out = '';
  res.setEncoding('utf8');
  res.on('data', (d) => out += d);
  res.on('end', () => console.log('Upload response:', res.statusCode, out));
});
req.on('error', (e) => console.error('Upload error', e));
req.write(body);
req.end();
