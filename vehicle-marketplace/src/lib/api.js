// Robust API client: prefers VITE_API_BASE_URL, but safely falls back to Render in prod.
const DEFAULT_REMOTE = "https://vehicle-home-mvp.onrender.com";

const ENV_BASE = (import.meta?.env?.VITE_API_BASE_URL ?? "").trim();
const isBrowser = typeof window !== "undefined";
const host = isBrowser ? window.location.hostname : "";
const onVercel = /vercel\.app$/i.test(host);

// Priority:
// 1) VITE_API_BASE_URL if provided
// 2) If running on Vercel domain, hard-fallback to Render API
// 3) Else, use the page origin (useful for local dev with a local server proxy)
const BASE_RAW = ENV_BASE || (onVercel ? DEFAULT_REMOTE : (isBrowser ? window.location.origin : ""));
const BASE = (BASE_RAW || DEFAULT_REMOTE).replace(/\/+$/, "");

function buildUrl(path, params) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(p, BASE); // absolute, no trailing slash
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request(path, { params, ...opts } = {}) {
  const url = buildUrl(path, params);
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text || url}`);
  try { return JSON.parse(text); } catch {
    throw new Error(`Unexpected non-JSON response from ${url}: ${text.slice(0, 120)}`);
  }
}

export const api = {
  search: ({ q, page = 1, pageSize = 20 } = {}) =>
    request("/api/search", { params: { q, page, pageSize } }),

  vehicleByVin: (vin) =>
    request(`/api/vehicles/${encodeURIComponent(vin)}`),

  photosByVin: (vin) =>
    request(`/api/vehicles/${encodeURIComponent(vin)}/photos`),

  historyByVin: (vin, type = "all") =>
    request(`/api/vehicles/${encodeURIComponent(vin)}/history`, { params: { type } }),
};

export default api;
