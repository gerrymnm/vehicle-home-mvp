// vehicle-marketplace/src/lib/api.js
const BASE =
  (import.meta?.env?.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL || "").trim() ||
  "https://vehicle-home-mvp.onrender.com/";

// normalize to absolute URL with trailing slash
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
    const txt = await res.text().catch(() => "");
    throw new Error(`Unexpected response (${res.status}): ${txt.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Accepts either:
 *   - search("mazda", 1, 20)
 *   - search({ q: "mazda", page: 1, pageSize: 20 })
 */
function search(input, pageMaybe, pageSizeMaybe) {
  let q = "";
  let page = 1;
  let pageSize = 20;

  if (typeof input === "object" && input !== null) {
    q = String(input.q ?? "");
    page = Number(input.page ?? 1);
    if (input.pageSize != null) pageSize = Number(input.pageSize);
  } else {
    q = String(input ?? "");
    page = Number(pageMaybe ?? 1);
    if (pageSizeMaybe != null) pageSize = Number(pageSizeMaybe);
  }

  return getJSON("api/search", { q, page, pageSize });
}

function vehicle(vin) {
  return getJSON(`api/vehicles/${encodeURIComponent(vin)}`);
}

function photos(vin) {
  return getJSON(`api/vehicles/${encodeURIComponent(vin)}/photos`);
}

function history(vin, type = "all") {
  return getJSON(`api/vehicles/${encodeURIComponent(vin)}/history`, { type });
}

export const api = { search, vehicle, photos, history };
export default api;
