import React from "react";

export default function PhotoUploader({ onUpload }) {
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    onUpload(urls); // append happens in parent
  };

  return (
    <div className="mb-3">
      <label className="inline-block">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <div className="cursor-pointer inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded">
          Choose Photos
        </div>
      </label>
      <p className="text-xs text-gray-500 mt-1">Up to 100 photos</p>
    </div>
  );
}
