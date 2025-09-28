// Frontend API client (no cookies, no credentials) to avoid CORS headaches
const BASE = (
  import.meta?.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")
    : "https://vehicle-home-mvp.onrender.com"
);

function parseJsonSafely(text) {
  try { return text ? JSON.parse(text) : {}; } catch { return { _raw: text }; }
}

async function toJson(res) {
  const text = await res.text();
  if (!res.ok) {
    // Try to surface a useful error message even if the server sent HTML
    const body = parseJsonSafely(text);
    const msg =
      (body && (body.error || body.message)) ||
      (text && text.slice(0, 140)) ||
      res.statusText ||
      "Request failed";
    throw new Error(msg);
  }
  return parseJsonSafely(text);
}

function get(path, { signal } = {}) {
  return fetch(`${BASE}${path}`, { method: "GET", signal }).then(toJson);
}

function post(path, body = {}, { signal } = {}) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // simple header => no preflight
    body: JSON.stringify(body),
    signal,
  }).then(toJson);
}

const api = {
  base: BASE,
  health: () => get(`/api/health`),
  search: (q, page = 1, pageSize = 20) =>
    get(`/api/search?q=${encodeURIComponent(q)}&page=${page}&pagesize=${pageSize}`),
  vehicle: (vin) => get(`/api/vehicles/${encodeURIComponent(vin)}`),
  photos: (vin) => get(`/api/vehicles/${encodeURIComponent(vin)}/photos`),
  history: (vin, type = "all") =>
    get(`/api/vehicles/${encodeURIComponent(vin)}/history?type=${encodeURIComponent(type)}`),
  createLead: (vin, payload) => post(`/api/leads`, { vin, ...payload }),
};

export default api;
export { api, get, post };
