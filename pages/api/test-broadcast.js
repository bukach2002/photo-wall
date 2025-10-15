const { broadcast } = require('./sse');

export default function handler(req, res) {
  try {
    const data = { type: 'photos:updated', items: [] };
    broadcast(data);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('test-broadcast error', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
