// Small API helper for the marketplace frontend

// Accept either VITE_API_BASE or VITE_API_BASE_URL (no trailing slash)
const ENV_BASE =
  (import.meta?.env?.VITE_API_BASE && String(import.meta.env.VITE_API_BASE)) ||
  (import.meta?.env?.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL)) ||
  "";

// Normalize: remove trailing slash, default to current origin (dev only)
const BASE = (ENV_BASE || window.location.origin).replace(/\/+$/, "");

// ---- low-level fetcher ------------------------------------------------------
async function request(path, { method = "GET", params, body, token } = {}) {
  const url = new URL(`${BASE}${path}`);

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }

  const headers = { "Accept": "application/json" };
  let payload;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { method, headers, body: payload, credentials: "omit" });

  // If the backend returned HTML (e.g., 404 page), throw a readable error
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Unexpected response (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || data?.ok === false) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ---- public API -------------------------------------------------------------
export async function searchVehicles({ q, page = 1, pagesize = 20, dir = "asc" } = {}) {
  return request("/api/search", { params: { q, page, pagesize, dir } });
}

export async function getVehicleByVin(vin) {
  if (!vin) throw new Error("VIN is required");
  return request(`/api/vehicles/${encodeURIComponent(vin)}`);
}

export async function getVehiclePhotos(vin) {
  if (!vin) throw new Error("VIN is required");
  return request(`/api/vin/photos`, { params: { vin } });
}

export async function getVehicleHistory(vin, type = "all") {
  if (!vin) throw new Error("VIN is required");
  return request(`/api/vin/history`, { params: { vin, type } });
}

// ---- auth endpoints (used by src/lib/auth.js) -------------------------------
export async function authRegister({ email, password }) {
  return request("/api/auth/register", { method: "POST", body: { email, password } });
}
export async function authLogin({ email, password }) {
  return request("/api/auth/login", { method: "POST", body: { email, password } });
}
export async function authMe(token) {
  return request("/api/auth/me", { token });
}

// Convenience default export with the base URL visible (handy for debugging)
const api = {
  BASE,
  search: searchVehicles,
  vehicle: getVehicleByVin,
  photos: getVehiclePhotos,
  history: getVehicleHistory,
  auth: { register: authRegister, login: authLogin, me: authMe },
};

export default api;
