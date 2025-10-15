// Simple in-memory SSE broadcaster that stores state on the global object so
// it survives module reloads in Next.js dev mode and can be shared across
// API route contexts in a single server instance.
const G = globalThis;
if (!G.__photoWallSSE) {
  G.__photoWallSSE = {
    clients: new Set(),
    // heartbeat interval id (to keep connections alive)
    heartbeat: null,
  };

  // start a heartbeat that sends a comment ping every 20s
  G.__photoWallSSE.heartbeat = setInterval(() => {
    for (const res of G.__photoWallSSE.clients) {
      try {
        res.write(`: ping\n\n`);
      } catch (e) {
        try { res.end(); } catch (e2) {}
        G.__photoWallSSE.clients.delete(res);
      }
    }
  }, 20000);
}

function addClient(res) {
  G.__photoWallSSE.clients.add(res);
  try {
    console.log('[sse] client connected, total=', G.__photoWallSSE.clients.size);
    try {
      // send an initial message so clients can verify data arrival immediately
      res.write(`event: welcome\n`);
      res.write(`data: ${JSON.stringify({ type: 'welcome', ts: Date.now() })}\n\n`);
      console.log('[sse] sent initial welcome to client');
    } catch (e) { /* ignore */ }
  } catch (e) {}
}

function removeClient(res) {
  try { G.__photoWallSSE.clients.delete(res); } catch (e) {}
}

function broadcast(data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  try {
    const type = (data && data.type) ? String(data.type) : '';
    console.log('[sse] broadcasting to', G.__photoWallSSE.clients.size, 'clients: ', type || (typeof data === 'string' ? data : 'object'));
  } catch (e) {}

  for (const res of Array.from(G.__photoWallSSE.clients)) {
    try {
      // log client writable state for diagnostics
      try { console.log('[sse] client state writableEnded=', res.writableEnded, 'writableFinished=', res.writableFinished); } catch (e) {}
      // if data.type exists, send an explicit event name
      if (data && typeof data === 'object' && data.type) {
        const ok1 = res.write(`event: ${String(data.type)}\n`);
        try { console.log('[sse] wrote event line, return=', ok1); } catch (e) {}
      }
      // always send JSON data
      const ok2 = res.write(`data: ${JSON.stringify(data)}\n\n`);
      res.flush();
      try { console.log('[sse] wrote data line, return=', ok2); } catch (e) {}
    } catch (e) {
      // remove and close on error
      try { res.end(); } catch (e2) {}
      G.__photoWallSSE.clients.delete(res);
      try { console.error('[sse] write error, removed client', e); } catch (e3) {}
    }
  }
}

module.exports = { addClient, removeClient, broadcast };
