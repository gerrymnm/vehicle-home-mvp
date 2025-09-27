// Tiny fetch wrapper for the frontend to call the backend safely.
// Reads base URL from Vite env: VITE_API_BASE_URL (must include https://...)
const BASE = (import.meta.env?.VITE_API_BASE_URL || "").trim();

// Always build URLs with the WHATWG URL API to avoid bad concatenation
function u(path, params) {
  const url = new URL(path.replace(/^\//, ""), BASE.endsWith("/") ? BASE : BASE + "/");
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  return url.toString();
}

async function request(path, { method = "GET", params, body } = {}) {
  const res = await fetch(u(path, params), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    // CRITICAL: no cookies/credentials => simpler CORS
    credentials: "omit",
    mode: "cors",
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { ok: false, error: text }; }
  if (!res.ok) throw new Error(data?.error || res.statusText || "Request failed");
  return data;
}

export const api = {
  search: ({ q, page = 1, pageSize = 20, dir = "asc" }) =>
    request("/api/search", { params: { q, page, pageSize, dir } }),
  vehicle: (vin) => request(`/api/vehicles/${encodeURIComponent(vin)}`),
  photos: (vin) => request(`/api/vehicles/${encodeURIComponent(vin)}/photos`),
  history: (vin, type = "all") =>
    request(`/api/vehicles/${encodeURIComponent(vin)}/history`, { params: { type } }),
};

export default api;
