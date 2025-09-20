import React from "react";

export default function PhotoGrid({ photos = [] }) {
  if (!photos.length) {
    return <div className="text-center text-gray-400">No Photos</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {photos.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`upload-${i}`}
          className="w-full h-36 object-cover rounded"
        />
      ))}
    </div>
  );
}
