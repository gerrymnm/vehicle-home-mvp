// src/components/PhotoSection.jsx
import React from "react";
import { can } from "../lib/permissions";
import PhotoUploader from "./PhotoUploader";
import PhotoGrid from "./PhotoGrid";

export default function PhotoSection({ role, photos, onUpload }) {
  const mayUpload = can(role, "photos.upload");

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Photos</h3>
        <span className="text-xs text-gray-400">Up to 100 photos</span>
      </div>

      {mayUpload ? (
        <PhotoUploader onUpload={onUpload} />
      ) : (
        <div className="mb-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">
          Photo uploads are <span className="font-medium">restricted</span> for your role.
          {/** demo copy to explain owner case */}
          {role === "Owner" && (
            <> Uploads are enabled when attaching photos to a recorded event (service, inspection, etc.).</>
          )}
        </div>
      )}

      <PhotoGrid photos={photos} />
    </section>
  );
}
