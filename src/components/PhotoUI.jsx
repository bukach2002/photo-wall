"use client";
import React from "react";

export function Header({ title }) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <nav>
        <a href="/wall" className="text-sm text-blue-600 underline mr-4">Photo Wall</a>
        <a href="/me/photos" className="text-sm text-gray-700 underline">My Uploads</a>
      </nav>
    </header>
  );
}

export function FloatingPhotoCard({ photo, index = 0, onRemove, onCaptionChange }) {
  // photo: { id, src, caption }
  return (
    <div className="border rounded overflow-hidden bg-gray-50">
      <div className="relative" style={{ paddingTop: '66%' }}>
        <img src={photo.src} alt={photo.caption || 'photo'} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="p-2">
        <input value={photo.caption || ''} onChange={(e) => onCaptionChange && onCaptionChange(photo.id, e.target.value)} placeholder="Optional caption" className="w-full p-1 border rounded text-sm" />
        <div className="mt-2 flex justify-between items-center">
          <button onClick={() => onRemove && onRemove(photo.id)} className="text-sm text-red-600">Remove</button>
          <span className="text-xs text-gray-500">{index + 1}</span>
        </div>
      </div>
    </div>
  );
}

export function GlobalEffects() {
  // small decorative element — kept lightweight
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white opacity-30"></div>
    </div>
  );
}

export default {
  Header,
  FloatingPhotoCard,
  GlobalEffects,
};
