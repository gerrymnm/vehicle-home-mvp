// Simple API client with a default base that works on Vercel + Render
const BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")
    : "https://vehicle-home-mvp.onrender.com") || "";

async function toJson(res) {
  const text = await res.text();
  if (!res.ok) {
    // surface server message when available
    const msg = text || res.statusText || "Request failed";
    throw new Error(msg);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Invalid JSON response");
  }
}

function get(path) {
  return fetch(`${BASE}${path}`, { credentials: "include" }).then(toJson);
}

function post(path, body) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  }).then(toJson);
}

const api = {
  base: BASE,
  // search
  search: (q, page = 1, pageSize = 20) =>
    get(`/api/search?q=${encodeURIComponent(q)}&page=${page}&pagesize=${pageSize}`),

  // vehicles
  vehicle: (vin) => get(`/api/vehicles/${encodeURIComponent(vin)}`),
  photos: (vin) => get(`/api/vehicles/${encodeURIComponent(vin)}/photos`),
  history: (vin, type = "all") =>
    get(`/api/vehicles/${encodeURIComponent(vin)}/history?type=${encodeURIComponent(type)}`),

  // leads
  createLead: (vin, payload) => post(`/api/leads`, { vin, ...payload }),
};

export default api;
export { get, post, api };
