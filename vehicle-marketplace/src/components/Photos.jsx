// Full file: vehicle-marketplace/src/components/Photos.jsx
import React from "react";

export default function Photos({ images = [] }) {
  if (!images?.length) return <p className="muted">No photos yet.</p>;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 12,
      }}
    >
      {images.map((src, i) => (
        <figure key={i} style={{ margin: 0 }}>
          <img
            src={src}
            alt={`Photo ${i + 1}`}
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              objectFit: "cover",
              border: "1px solid #e3e3e3",
              borderRadius: 6,
              background: "#fff",
            }}
            loading="lazy"
          />
        </figure>
      ))}
    </div>
  );
}
