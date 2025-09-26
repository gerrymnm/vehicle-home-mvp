// Tiny fetch wrapper for the frontend to call the backend.
// It reads the base URL from Vite env: VITE_API_BASE_URL
const BASE = import.meta?.env?.VITE_API_BASE_URL || "";

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

export const api = {
  search({ q, page = 1, pageSize = 20 }) {
    const p = new URLSearchParams({ q: q || "", page: String(page), pagesize: String(pageSize) });
    return request(`/api/search?${p.toString()}`);
  },
  vehicle(vin) {
    return request(`/api/vehicles/${encodeURIComponent(vin)}`);
  }
};

export default api;
