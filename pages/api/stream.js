const { addClient, removeClient } = require('./sse');

export default function handler(req, res) {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // advise reverse proxies not to buffer event-streams
  try { res.setHeader('X-Accel-Buffering', 'no'); } catch (e) {}
  res.flushHeaders && res.flushHeaders();

  // send a comment as a ping
  res.write(': connected\n\n');

  addClient(res);

  // ensure the underlying socket is kept alive
  if (req.socket && typeof req.socket.setKeepAlive === 'function') {
    try { req.socket.setKeepAlive(true, 20000); } catch (e) {}
  }

  const onClose = () => {
    try { removeClient(res); } catch (e) {}
    try { res.end(); } catch (e) {}
  };

  req.on('close', onClose);
  req.on('end', onClose);
}
