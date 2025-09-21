// vehicle-marketplace/src/lib/api.js

// -------- Base URL --------
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

// -------- Token helpers (safe for SSR/build) --------
function getAccessToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("vh_at") || null;
}

export function setTokens(tokens = {}) {
  if (typeof localStorage === "undefined") return;
  const { accessToken, refreshToken } = tokens;
  if (accessToken) localStorage.setItem("vh_at", accessToken);
  else localStorage.removeItem("vh_at");

  if (refreshToken) localStorage.setItem("vh_rt", refreshToken);
  else localStorage.removeItem("vh_rt");
}

export function clearTokens() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem("vh_at");
  localStorage.removeItem("vh_rt");
}

// -------- Low-level request helper --------
async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const at = getAccessToken();
  if (at) headers.Authorization = `Bearer ${at}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg;
    try {
      const data = await res.json();
      msg = data?.error || data?.message;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg || `${options.method || "GET"} ${path} failed (${res.status})`);
  }

  if (res.status === 204) return null;

  const ctype = res.headers.get("content-type") || "";
  return ctype.includes("application/json") ? res.json() : res.text();
}

function get(path) {
  return request(path);
}

function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

// Keep both `http` and `api` so existing imports continue to work
export const http = { base: API_BASE, get, post };
export const api  = { base: API_BASE, request, get, post, setTokens, clearTokens };

// -------- Domain helpers --------
export function searchVehicles({ q = "", page = 1, sort = "relevance" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page) params.set("page", String(page));
  if (sort) params.set("sort", sort);
  return get(`/search?${params.toString()}`);
}

export function fetchVehicleByVin(vin) {
  return get(`/vehicles/${encodeURIComponent(vin)}`);
}

export function createLead(payload) {
  // { vin, name, email?, phone?, message? }
  return post(`/api/leads`, payload);
}
