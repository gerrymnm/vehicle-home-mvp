import React, { useState } from "react";

export default function PhotoGrid({ photos = [] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const openAt = (i) => {
    setIdx(i);
    setOpen(true);
  };

  if (!Array.isArray(photos) || photos.length === 0) {
    return <p style={{ color: "#666" }}>No photos yet.</p>;
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          maxWidth: 720,
        }}
      >
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => openAt(i)}
            style={{
              padding: 0,
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: 4,
              cursor: "pointer",
              overflow: "hidden",
              height: 110,
            }}
            aria-label={`Open photo ${i + 1}`}
          >
            <img
              src={src}
              alt={`photo ${i + 1}`}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <img
            src={photos[idx]}
            alt={`photo ${idx + 1}`}
            style={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: 6 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
