// Robust API client that works with or without VITE_API_BASE_URL

// If VITE_API_BASE_URL is set, we use it (no trailing slash).
// Otherwise we fall back to window.location.origin so relative calls work on Vercel.
const ENV_BASE = (import.meta?.env?.VITE_API_BASE_URL ?? "").trim();
const RUNTIME_ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";
const BASE = (ENV_BASE || RUNTIME_ORIGIN).replace(/\/+$/, "");

function buildUrl(path, params) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(p, BASE || "http://localhost"); // URL needs a base
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

async function request(path, { params, ...opts } = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text || path}`);
  }
  return res.json();
}

export const api = {
  search: ({ q, page = 1, pageSize = 20 } = {}) =>
    request("/api/search", { params: { q, page, pageSize } }),

  vehicleByVin: (vin) =>
    request(`/api/vehicles/${encodeURIComponent(vin)}`),

  photosByVin: (vin) =>
    request(`/api/vehicles/${encodeURIComponent(vin)}/photos`),

  historyByVin: (vin, type = "all") =>
    request(`/api/vehicles/${encodeURIComponent(vin)}/history`, {
      params: { type },
    }),
};

// legacy default export
export default api;
