const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

export const config = {
  api: {
    bodyParser: false,
  },
};

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = new formidable.IncomingForm({ uploadDir, keepExtensions: true, multiples: true });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Form parse error', err);
      return res.status(500).json({ error: 'Form parse failed' });
    }

  // normalize common fields (may be arrays when parsed)
  const norm = (v) => Array.isArray(v) ? v[0] : (v || '');
  const name = norm(fields.name);
  const email = norm(fields.email);
  // captions may be single or array
    let captions = fields.captions || [];
    if (!Array.isArray(captions)) captions = [captions];
  // consent may be provided as 'yes'/'no' (or array)
  const rawConsent = fields.consent || 'no';
  const consentVal = Array.isArray(rawConsent) ? rawConsent[0] : rawConsent;
  const consent = String(consentVal).toLowerCase() === 'yes';

    const saved = [];
      const photosJson = path.join(process.cwd(), 'data', 'photos.json');
    const existing = readJSON(photosJson);

    const normalizeFiles = (f) => {
      if (!f) return [];
      return Array.isArray(f) ? f : [f];
    };

    const uploadedFiles = normalizeFiles(files.photos || files.file || files.files);

    for (let idx = 0; idx < uploadedFiles.length; idx++) {
      const f = uploadedFiles[idx];
      // formidable may expose different temp path properties depending on version
      const srcTmp = f && (f.filepath || f.path || f.tempFilePath || f.tempFile || f.file);
      if (!srcTmp || typeof srcTmp !== 'string') {
        console.error('Skipping upload: missing temp path for file', f);
        continue;
      }

      const originalName = f.originalFilename || f.name || path.basename(srcTmp) || 'photo';
      const ext = path.extname(originalName) || path.extname(srcTmp) || '';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

      const dest = path.join(uploadDir, filename);
      console.log('Saving upload', originalName, ' as ', filename, ' on ', dest, ' from ', srcTmp);
      try {
        fs.renameSync(srcTmp, dest);
      } catch (e) {
        console.error('File rename error', e);
        // if rename fails, try copying
        try {
          fs.copyFileSync(srcTmp, dest);
          try { fs.unlinkSync(srcTmp); } catch (eUnlink) { /* ignore */ }
        } catch (e2) {
          console.error('File save error', e2);
          continue;
        }
      }

      const url = `/uploads/${filename}`;
      const item = {
        id: filename,
        src: url,
        caption: captions[idx] || '',
        uploader: { name, email },
        consent: consent,
        createdAt: Date.now(),
      };
      saved.push(item);
      existing.push(item);
    }

    // keep reasonable limit
    const merged = existing.slice(0, 10000);
    writeJSON(photosJson, merged);

    // notify any SSE clients that new photos are available
    try {
      const { broadcast } = require('./sse');
      broadcast({ type: 'photos:updated', items: saved });
    } catch (e) {
      // ignore if SSE broadcaster not available
    }

    return res.status(200).json({ ok: true, saved });
  });
}
