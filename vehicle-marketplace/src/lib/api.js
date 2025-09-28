// vehicle-marketplace/src/lib/api.js
const BASE =
  (import.meta?.env?.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || "").trim() ||
  "https://vehicle-home-mvp.onrender.com/";

// force a proper absolute base ending with /
const API_BASE = new URL(BASE.endsWith("/") ? BASE : BASE + "/").toString();

async function getJSON(path, params) {
  const url = new URL(path, API_BASE);
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    mode: "cors",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    // surface backend HTML errors (like "Cannot GET /...") as text
    const txt = await res.text().catch(() => "");
    throw new Error(`Unexpected response (${res.status}): ${txt.slice(0, 200)}`);
  }
  return res.json();
}

export const api = {
  search: (q, page = 1, pageSize = 20) =>
    getJSON("api/search", { q, page, pageSize }),
  vehicle: (vin) =>
    getJSON(`api/vehicles/${encodeURIComponent(vin)}`),
  photos: (vin) =>
    getJSON(`api/vehicles/${encodeURIComponent(vin)}/photos`),
  history: (vin, type = "all") =>
    getJSON(`api/vehicles/${encodeURIComponent(vin)}/history`, { type }),
};

export default api;
