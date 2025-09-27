// vehicle-marketplace/src/lib/api.js

// Base URL comes from Vercel/Vite env (Settings → Environment Variables)
const BASE =
  (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/+$/, ""); // strip trailing slash

async function request(path, { params, ...opts } = {}) {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const res = await fetch(url.toString(), {
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

// also export default for any legacy imports
export default api;
