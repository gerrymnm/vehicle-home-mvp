// Tiny fetch wrapper for the frontend to call the backend.
// It reads the base URL from Vite env: VITE_API_BASE_URL

const BASE = import.meta?.env?.VITE_API_BASE_URL || "";

async function http(path, opts = {}) {
  const url = `${BASE}${path}`;
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "omit",
    ...opts,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(text || `HTTP ${r.status}`);
  }
  // Some endpoints may return HTML error pages; try JSON safely.
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return { ok: true };
  return r.json();
}

export const api = {
  search: async ({ q, page = 1, pageSize = 20 } = {}) => {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    usp.set("page", String(page));
    usp.set("pagesize", String(pageSize));
    return http(`/api/search?${usp.toString()}`);
  },

  vehicles: {
    getByVin: async (vin) => http(`/api/vehicles/${encodeURIComponent(vin)}`),
    getPhotos: async (vin) => http(`/api/vehicles/${encodeURIComponent(vin)}/photos`),
    getHistory: async (vin, type = "all") =>
      http(`/api/vehicles/${encodeURIComponent(vin)}/history?type=${encodeURIComponent(type)}`),
  },
};

export { http }; // keep named export for other files that may use it
export default api; // optional default to avoid accidental import mistakes
