// Full file: vehicle-marketplace/src/components/Photos.jsx
import React from "react";

export default function Photos({ images = [] }) {
  if (!images?.length) return <p>No photos yet.</p>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, maxWidth: 760 }}>
      {images.map((src, i) => (
        <figure key={i} style={{ margin: 0 }}>
          <img
            src={src}
            alt={`Photo ${i + 1}`}
            style={{ width: "100%", height: 120, objectFit: "cover", border: "1px solid #ddd", borderRadius: 4 }}
            loading="lazy"
          />
        </figure>
      ))}
    </div>
  );
}
