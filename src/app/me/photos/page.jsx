"use client";
import React, { useRef, useState, useEffect } from "react";
import { Header, FloatingPhotoCard, GlobalEffects } from "@/components/PhotoUI";

export default function UserPhotoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [consent, setConsent] = useState(true);
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("photo-wall:user") || "null");
      if (u) {
        setName(u.name || "");
        setEmail(u.email || "");
      }
    } catch (e) {}
  }, []);

  const handleFiles = async (files) => {
    const arr = Array.from(files).slice(0, 12);
    const previews = await Promise.all(
      arr.map((file, i) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = (e) => res({ id: "local-" + Date.now() + "-" + i, file, src: e.target.result, caption: "" });
          r.readAsDataURL(file);
        })
      )
    );
    setItems((s) => [...previews, ...s]);
  };

  const uploadAll = async () => {
    if (!name.trim() || !email.trim()) return alert("Please enter your name and email.");
    if (!consent) return alert("Please confirm consent to allow event organisers to use your photos on social media.");
    if (!items.length) return alert("Please add some photos first.");
    setUploading(true);
    try {
      // Build form and send to server
      const form = new FormData();
      form.append('name', name.trim());
      form.append('email', email.trim());
      form.append('consent', consent ? 'yes' : 'no');
      // append captions in same order
      items.forEach((it) => {
        if (it.file instanceof File) {
          form.append('photos', it.file);
          form.append('captions', it.caption || '');
        }
      });

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Upload failed');
      }
      const data = await res.json();
      // clear previews after successful upload
      try { window.dispatchEvent(new CustomEvent('photo-wall:updated')); } catch (e) {}
      alert('Upload successful — photos saved on server.');
      setItems([]);
    } catch (err) {
      console.error("Save failed", err);
      alert("Save failed: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* <Header title="My Uploads" /> */}
        <header className="fixed-header" role="banner">
          <div className="fixed-header-inner">
            <h1 className="header-title">Diwali 2025 Celebration @ GQ</h1>
          </div>
        </header>
        <section className="mb-6 bg-white p-6 rounded shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="p-2 border rounded" />
            <input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="inline-flex items-center px-3 py-2 border rounded cursor-pointer bg-white shadow-sm">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              <span>Add photos</span>
            </label>
            <button onClick={uploadAll} disabled={uploading || !items.length} className="ml-3 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{uploading ? "Saving..." : "Save to wall"}</button>
            <div className="mt-3 text-sm text-gray-700">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I give consent for event organisers to use my uploaded photos on social media channels.</span>
              </label>
            </div>
            {/* <a href="/wall" className="ml-3 text-sm text-blue-600 underline">Open Photo Wall</a> */}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((it, idx) => (
              <FloatingPhotoCard key={it.id} photo={it} index={idx} onRemove={(id) => setItems((s) => s.filter((i) => i.id !== id))} onCaptionChange={(id, c) => setItems((s) => s.map((i) => (i.id === id ? { ...i, caption: c } : i)))} />
            ))}
          </div>
        </section>
      </div>
      <GlobalEffects />
    </div>
    
  );
}
