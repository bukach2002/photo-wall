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

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export default function handler(req, res) {
  const photosJson = path.join(process.cwd(), 'data', 'photos.json');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const items = readJSON(photosJson);

  if (req.method === 'GET') {
    // Find missing entries and candidate files
    const allFiles = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
    const missing = items
      .map((it) => ({ id: it.id, expected: it.src, exists: fs.existsSync(path.join(process.cwd(), 'public', it.src || '')), item: it }))
      .filter((x) => !x.exists)
      .map((x) => {
        const ext = path.extname(x.expected || '') || '';
        const candidates = allFiles.filter((f) => path.extname(f).toLowerCase() === ext.toLowerCase());
        return { id: x.id, expected: x.expected, candidates };
      });
    return res.status(200).json({ missing, allFiles });
  }

  if (req.method === 'POST') {
    // Expect body: { fixes: [{ id, candidate }] }
    try {
      const body = req.body || {};
      const fixes = Array.isArray(body.fixes) ? body.fixes : [];
      const allFiles = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
      const updated = [];

      fixes.forEach((f) => {
        const idx = items.findIndex((it) => it.id === f.id);
        if (idx === -1) return;
        const it = items[idx];
        const expectedName = path.basename(it.src || it.id || `fixed-${Date.now()}`);
        const candidate = f.candidate;
        if (!candidate) return;
        const candidatePath = path.join(uploadDir, candidate);
        if (!fs.existsSync(candidatePath)) return;
        const destPath = path.join(uploadDir, expectedName);
        try {
          fs.copyFileSync(candidatePath, destPath);
          // update item src to expected path
          items[idx].src = `/uploads/${expectedName}`;
          // optionally update id
          items[idx].id = expectedName;
          updated.push({ id: items[idx].id, src: items[idx].src });
        } catch (e) {
          // ignore individual failures
        }
      });

      // write back
      writeJSON(photosJson, items);
      return res.status(200).json({ ok: true, updated });
    } catch (e) {
      console.error('Repair error', e);
      return res.status(500).json({ error: 'Repair failed' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end('Method Not Allowed');
}
