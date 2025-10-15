"use client";
import React, { useEffect, useState, useRef } from "react";

function initials(name) {
  if (!name || typeof name !== 'string') return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0]?.toUpperCase() || "?") + (parts[1][0]?.toUpperCase() || "");
}

export default function PhotoWallPage() {
  const [photos, setPhotos] = useState([]);
  const [broken, setBroken] = useState(new Set());
  const [displayMode, setDisplayMode] = useState('tile'); // 'bubble' or 'tile'
  const [bgUrl, setBgUrl] = useState('');
  const [bgMode, setBgMode] = useState('cover');
  const [bgPanelOpen, setBgPanelOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const autoSpeedRef = useRef(40); // px per second (slow)
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const resettingRef = useRef(false);
  // infinite scroll + configurable page size
  const [perPage, setPerPage] = useState(24);
  const [visibleCount, setVisibleCount] = useState(perPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const load = async () => {
        console.log('Loading photos...');
      try {
        const res = await fetch('/api/photos');
        if (!res.ok) throw new Error('Failed to fetch');
        const j = await res.json();
        // normalize items: uploader fields may be arrays when parsed by formidable
        const items = (j.items || []).map((it) => {
          const uploader = it.uploader || {};
          const name = Array.isArray(uploader.name) ? uploader.name[0] : uploader.name || '';
          const email = Array.isArray(uploader.email) ? uploader.email[0] : uploader.email || '';
          return {
            ...it,
            src: typeof it.src === 'string' ? it.src : Array.isArray(it.src) ? it.src[0] : '',
            uploader: { name, email },
          };
        });
        setBroken(new Set());
        setPhotos(items);
        // reset visible count when photos refreshed
        setVisibleCount(perPage);
      } catch (e) {
        console.error('Load photos failed', e);
        setPhotos([]);
      }
    };
    load();
    // load display mode from localStorage
    try {
      const dm = localStorage.getItem('photo-wall:displayMode');
      if (dm === 'tile' || dm === 'bubble') setDisplayMode(dm);
      const savedBg = localStorage.getItem('photo-wall:background') || '';
      const savedBgMode = localStorage.getItem('photo-wall:backgroundMode') || 'cover';
      if (savedBg) setBgUrl(savedBg);
      setBgMode(savedBgMode);
      const savedPer = parseInt(localStorage.getItem('photo-wall:perPage') || '', 10);
      if (savedPer && !Number.isNaN(savedPer)) { setPerPage(savedPer); setVisibleCount(savedPer); }
    } catch (e) {}
    const onUpdate = () => load();
    window.addEventListener('photo-wall:updated', onUpdate);

    // try to open an EventSource to receive updates in real-time
    let es;
    try {
      es = new EventSource('/api/stream');
      // generic message handler (fallback)
      const onMessage = (ev) => {
        console.log('OnMessage event ...', ev.data);
        try {
          const d = JSON.parse(ev.data);
          // named events will also be handled by the dedicated listener below
          if (d && d.type === 'photos:updated') {
            console.log('Photos updated event received, reloading photos');
            load();
          } else {
            console.log('Generic message received, reloading photos');
            load();
          }
        } catch (e) {
            console.error('OnMessage parse error', e);
          load();
        }
      };

      // named event listener for explicit event types sent by the server
      const onPhotosUpdated = (ev) => {
        console.log('onPhotosUpdated event ...', ev.data);
        try {
          const d = JSON.parse(ev.data);
          if (!d || d.type !== 'photos:updated') {
            load();
            return;
          }
          load();
        } catch (e) {
          load();
        }
      };

      es.addEventListener('message', onMessage);
      es.addEventListener('photos:updated', onPhotosUpdated);
      es.onerror = (err) => {
        console.log('EventSource error', err);
        // probably disconnected; close and rely on manual reload/polling
        try { es.close(); } catch (e) {}
      };
    } catch (e) {
      // EventSource not available; keep polling via dispatched events
    }

    return () => {
      window.removeEventListener('photo-wall:updated', onUpdate);
      try {
        if (es) {
          es.removeEventListener('message', onMessage);
          es.removeEventListener('photos:updated', onPhotosUpdated);
          es.close();
        }
      } catch (e) {}
    };
  }, []);

  const switchMode = (mode) => {
    if (mode !== 'tile' && mode !== 'bubble') return;
    setDisplayMode(mode);
    try { localStorage.setItem('photo-wall:displayMode', mode); } catch (e) {}
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
      resettingRef.current = false;
      return;
    }

    function step(ts) {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const delta = ts - lastTimeRef.current;
      lastTimeRef.current = ts;

      // If we're in resetting (smooth scroll to top), skip incremental scroll until at top
      if (resettingRef.current) {
        if (window.scrollY <= 1) {
          resettingRef.current = false;
        }
      } else {
        const speed = autoSpeedRef.current; // px per second
        const move = (speed * delta) / 1000;
        window.scrollBy({ top: move, left: 0, behavior: 'auto' });

        const nearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 2);
        if (nearBottom) {
          // smooth reset to top
          resettingRef.current = true;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);

    // Pause auto-scroll on user interaction (wheel/touch) and require toggle to resume
    const onUser = () => setAutoScroll(false);
    window.addEventListener('wheel', onUser, { passive: true });
    window.addEventListener('touchstart', onUser, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('wheel', onUser);
      window.removeEventListener('touchstart', onUser);
    };
  }, [autoScroll]);

    // infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // load more
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((v) => Math.min(photos.length, v + perPage));
            setLoadingMore(false);
          }, 250); // small debounce for UX
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [photos]);

  // update visibleCount when perPage changes
  useEffect(() => {
    setVisibleCount(perPage);
    try { localStorage.setItem('photo-wall:perPage', String(perPage)); } catch (e) {}
  }, [perPage]);

  const containerStyle = bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: bgMode === 'cover' ? 'cover' : bgMode === 'contain' ? 'contain' : 'auto', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {};

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-blue-50 via-white to-blue-50 relative" style={containerStyle}>
      {bgUrl && <div className="bg-overlay" aria-hidden />}
      <div className="max-w-screen mx-auto content-layer">
     
        <div className="mb-4 hidden flex items-center gap-3">
          <div className="text-sm text-gray-600">Items per load:</div>
          <select value={perPage} onChange={(e) => setPerPage(parseInt(e.target.value || '24', 10))} className="p-1 border rounded">
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
          <div className="text-xs text-gray-500 ml-4">Tip: use smaller values for slower devices.</div>
           <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600 mr-2">View:</div>
              <button onClick={() => switchMode('bubble')} aria-pressed={displayMode === 'bubble'} className={`px-3 py-1 rounded ${displayMode === 'bubble' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Bubble</button>
              <button onClick={() => switchMode('tile')} aria-pressed={displayMode === 'tile'} className={`px-3 py-1 rounded ${displayMode === 'tile' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Tile</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setBgPanelOpen((s) => !s)} className="px-3 py-1 rounded bg-white border">Background</button>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-3 hidden">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
            Auto-scroll
          </label>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-xs">Speed:</label>
            <input type="range" min="10" max="200" value={autoSpeedRef.current} onChange={(e) => { autoSpeedRef.current = Number(e.target.value); }} />
          </div>
        </div>
        {bgPanelOpen && (
          <div className="mb-4 p-3 bg-white border rounded shadow-sm">
            <div className="mb-2 text-sm font-medium">Choose background</div>
            <div className="flex items-center gap-2 mb-2">
              <input placeholder="Paste image URL" value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} className="p-2 border rounded w-full" />
              <button onClick={() => { try { localStorage.setItem('photo-wall:background', bgUrl); } catch (e) {} alert('Background saved'); }} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
            </div>
            <div className="mb-2 text-sm">Or pick from uploaded photos</div>
            <div className="flex gap-2 overflow-x-auto py-2">
              {photos.map((p) => (
                <button key={p.id} onClick={() => { setBgUrl(p.src); try { localStorage.setItem('photo-wall:background', p.src); } catch (e) {} }} className="w-20 h-12 rounded overflow-hidden border">
                  <img src={p.src} alt={p.caption || ''} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
            <div className="mt-2 text-sm">Mode:
              <select value={bgMode} onChange={(e) => { setBgMode(e.target.value); try { localStorage.setItem('photo-wall:backgroundMode', e.target.value); } catch (e) {} }} className="ml-2 p-1 border rounded">
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="center">Center</option>
              </select>
            </div>
          </div>
        )}
        <header className="fixed-header" role="banner">
          <div className="fixed-header-inner">
            <h1 className="header-title">Diwali 2025 Celebration @ GQ</h1>
          </div>
        </header>
        {displayMode === 'bubble' ? (
          <div className="relative w-full h-screen bg-gradient-to-b from-white to-blue-50 rounded shadow overflow-hidden">
            {/* render drops */}
            {photos.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">No photos yet — add some from My Uploads</div>
            )}
            {photos.slice(0, visibleCount).map((p, i) => {
              // random-ish position and size based on id
              const seed = (p.createdAt || i) % 1000;
              const left = ((seed * 997) % 100) + Math.sin(seed) * 5;
              const top = ((seed * 811) % 90) + Math.cos(seed) * 5;
              const size = 48 + ((seed * 13) % 160);
              const delay = ((seed * 7) % 8) + (i % 3) * 0.2;
              const style = {
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
              };
              const isBroken = broken.has(p.id);
              return (
                <div key={p.id} className={`photo-drop group fade-in ${isBroken ? 'no-image' : ''}`} style={style} title={p.caption || (p.uploader && p.uploader.name)}>
                  {!isBroken && p.src ? (
                    <img
                      src={p.src}
                      alt={p.caption || 'photo'}
                      className="photo-img"
                      loading="lazy"
                      decoding="async"
                      onError={() => setBroken((s) => new Set([...s, p.id]))}
                    />
                  ) : (
                    <div className="no-img-fallback">
                      <div className="big-initials">{initials(p.uploader?.name)}</div>
                    </div>
                  )}
                  <div className="drop-meta">
                    <div className="avatar">{initials(p.uploader?.name)}</div>
                    <div className="caption">{p.caption}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="masonry">
            {photos.slice(0, visibleCount).map((p) => (
              <div key={p.id} className="masonry-item tile-card fade-in">
                {p.src ? (
                  <img src={p.src} alt={p.caption || 'photo'} className="masonry-img" loading="lazy" decoding="async" onError={() => setBroken((s) => new Set([...s, p.id]))} />
                ) : (
                  <div className="masonry-placeholder">{initials(p.uploader?.name)}</div>
                )}
                <div className="p-2">
                  <div className="text-sm font-medium">{p.uploader?.name}</div>
                  <div className="text-xs text-gray-600 truncate">{p.caption}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* <div ref={sentinelRef} className="mt-6 flex items-center justify-center">
          {loadingMore ? <div className="text-sm text-gray-600">Loading more…</div> : visibleCount < photos.length ? <div className="text-sm text-gray-600">Scroll to load more</div> : <div className="text-sm text-gray-600">End of photos</div>}
        </div> */}
        {photos.length > 1000 && (
          <div className="mt-2 text-xs text-red-600">Warning: very large photo collections may need virtualization. Consider using react-window or similar for best performance.</div>
        )}

  
      </div>

      <style jsx>{`
        .photo-drop {
          position: absolute;
          transform: translate(-50%, -50%) scale(0.9);
          border-radius: 999px;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(13, 38, 76, 0.12);
          background: rgba(255,255,255,0.6);
          animation: floatUp 6s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
        }
  /* when background image is set, dim with an overlay via background blend */
        .bg-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.25);
          z-index: 5;
          pointer-events: none;
        }
        .content-layer { position: relative; z-index: 10; }
        .photo-drop .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .photo-drop.no-image {
          background: linear-gradient(180deg, #f3f4f6, #e6eef9);
        }
        .no-img-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .big-initials {
          font-size: 20px;
          font-weight: 700;
          color: #334155;
        }
        /* tile card styles */
  .tile-card img { display: block; background: #f8fafc; }
  .tile-card .p-2 { padding: 0.5rem; }
  .tile-card .w-full.h-48 { background: #f8fafc; }
        /* masonry / instagram-like feed */
        .masonry {
          column-count: 2;
          column-gap: 1rem;
        }
        @media (min-width: 640px) {
          .masonry { column-count: 3; }
        }
        @media (min-width: 1024px) {
          .masonry { column-count: 4; }
        }
        .masonry-item { break-inside: avoid; margin-bottom: 1rem; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .masonry-img { width: 100%; height: auto; display: block; }
        .masonry-placeholder { width: 100%; padding: 2.5rem 0; display:flex; align-items:center; justify-content:center; background:#f3f4f6; font-weight:700; }
  .fade-in { animation: fadeIn 360ms ease both; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .photo-drop .drop-meta {
          position: absolute;
          bottom: -999px;
          left: 50%;
          transform: translateX(-50%);
          width: max-content;
          min-width: 120px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 6px 8px;
          border-radius: 8px;
          font-size: 12px;
          opacity: 0;
          transition: all 160ms ease;
          pointer-events: none;
        }
        .photo-drop:hover .drop-meta, .photo-drop:focus-within .drop-meta, .photo-drop.group:hover .drop-meta {
          bottom: 10px;
          opacity: 1;
        }
        .drop-meta .avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ffffff22;
          color: white;
          margin-right: 8px;
          font-weight: 700;
        }
        .drop-meta .caption {
          display: inline-block;
          max-width: 240px;
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @keyframes floatUp {
          0% { transform: translate(-50%, -50%) translateY(0) scale(0.96); }
          50% { transform: translate(-50%, -46%) translateY(-6px) scale(1); }
          100% { transform: translate(-50%, -50%) translateY(0) scale(0.96); }
        }
        /* fixed header */
        .fixed-header { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); width: calc(100% - 48px); max-width: 1100px; z-index: 60; }
        .fixed-header-inner { background: rgba(255,255,255,0.6); backdrop-filter: blur(6px); padding: 10px 16px; border-radius: 12px; box-shadow: 0 6px 18px rgba(2,6,23,0.08); display:flex; align-items:center; justify-content:center; }
        .header-title { 
          font-size: 1.5rem; 
          font-weight:800; 
          margin:0; 
          display: inline-block;
          /* animated gradient text from rgb(38,57,131) to rgb(58,87,196) */
          background: linear-gradient(90deg, rgb(38,57,131), rgb(58,87,196));
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          /* subtle shadow to improve contrast on busy backgrounds */
          text-shadow: 0 1px 2px rgba(15,23,42,0.12);
          /* animate the gradient sliding left-to-right */
          animation: animate-gradient 6s linear infinite;
          transition: transform 180ms ease, text-shadow 180ms ease;
        }

        .header-title:hover, .header-title:focus {
          transform: translateY(-2px) scale(1.02);
          text-shadow: 0 4px 14px rgba(15,23,42,0.18);
        }

        @keyframes animate-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        /* ensure main content isn't hidden behind header */
        .content-layer { padding-top: 72px; }
      `}</style>
    </div>
  );
}
