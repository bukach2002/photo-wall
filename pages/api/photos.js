const fs = require('fs');
const path = require('path');

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

export default function handler(req, res) {
  const photosJson = path.join(process.cwd(), 'data', 'photos.json');
  const items = readJSON(photosJson);
  res.status(200).json({ items });
}
