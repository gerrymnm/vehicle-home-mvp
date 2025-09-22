import React, { useRef, useState } from "react";
import { uploadImage } from "../lib/pinata.js";
import { apiUrl } from "../lib/api.js";

export default function ImageUploader({ vin, onAdded }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  async function pick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const { url } = await uploadImage(f);
      await fetch(apiUrl(`/api/vehicles/${encodeURIComponent(vin)}/images`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ url }),
      });
      onAdded?.(url);
      inputRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }
  return <input ref={inputRef} type="file" accept="image/*" disabled={busy} onChange={pick} />;
}
