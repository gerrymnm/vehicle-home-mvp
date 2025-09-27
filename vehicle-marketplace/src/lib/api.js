// vehicle-marketplace/src/lib/api.js
const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  // Try to parse JSON; if it fails, throw a readable error
  let data;
  try {
    data = await res.json();
  } catch {
    const text = await res.text();
    throw new Error(text || `Bad response (${res.status})`);
  }
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  async search({ q, page = 1, pageSize = 20, dir = "asc" }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(page));
    params.set("pagesize", String(pageSize));
    params.set("dir", dir);
    return request(`/api/search?${params.toString()}`);
  },

  async vehicle(vin) {
    return request(`/api/vehicles/${encodeURIComponent(vin)}`);
  },
};
