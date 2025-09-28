// Full file: vehicle-marketplace/src/lib/api.js

// ---- Config ---------------------------------------------------------------

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "https://vehicle-home-mvp.onrender.com/api"; // fallback to Render API

// Token helper (kept local to avoid circular import with lib/auth.js)
const TOKEN_KEY = "vh_token";
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

// Build URL with optional query params
function makeUrl(path, params) {
  const u = new URL(path.replace(/^\//, ""), API_BASE + "/");
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
    });
  }
  return u.toString();
}

// Core fetch wrapper
async function request(path, { method = "GET", body, headers = {}, auth = false } = {}) {
  const h = {
    Accept: "application/json",
    ...headers,
  };

  // JSON body?
  let payload;
  if (body !== undefined) {
    h["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  // Bearer token if requested
  if (auth) {
    const t = getToken();
    if (t) h.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(path, {
    method,
    headers: h,
    body: payload,
    mode: "cors",
    credentials: "omit",
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = isJson ? (data?.error || data?.message || `HTTP ${res.status}`) : String(data);
    throw new Error(msg);
  }
  return data;
}

// Convenience methods
async function get(path, params, opts) {
  const url = makeUrl(path, params);
  return request(url, { method: "GET", ...(opts || {}) });
}
async function post(path, body, opts) {
  const url = makeUrl(path);
  return request(url, { method: "POST", body, ...(opts || {}) });
}

// ---- Vehicles + Search ----------------------------------------------------

export async function searchVehicles({ q = "", page = 1, pageSize = 20, dir = "asc" } = {}) {
  return get("/search", { q, page, pageSize, dir });
}

export async function getVehicleByVin(vin) {
  if (!vin) throw new Error("vin_required");
  return get(`/vehicles/${encodeURIComponent(vin)}`);
}

export async function getVehiclePhotos(vin) {
  if (!vin) throw new Error("vin_required");
  return get(`/vehicles/${encodeURIComponent(vin)}/photos`);
}

export async function getVehicleHistory(vin, type = "all") {
  if (!vin) throw new Error("vin_required");
  return get(`/vehicles/${encodeURIComponent(vin)}/history`, { type });
}

// ---- Auth -----------------------------------------------------------------

export async function authLogin({ email, password }) {
  return post("/auth/login", { email, password });
}

export async function authRegister({ name, email, password }) {
  return post("/auth/register", { name, email, password });
}

export async function authMe() {
  return get("/auth/me", undefined, { auth: true });
}

// ---- Dealer (placeholder) -------------------------------------------------

export async function dealerInventory({ page = 1, pageSize = 25 } = {}) {
  const url = makeUrl("/dealer/inventory", { page, pageSize });
  try {
    const data = await request(url, { method: "GET", auth: true });
    if (data && typeof data === "object") return data;
  } catch {
    // swallow if endpoint not present or auth not configured yet
  }
  return { ok: true, items: [], page, totalPages: 1, total: 0 };
}

// ---- Export default API surface ------------------------------------------

const api = {
  API_BASE,
  // low-level
  get,
  post,
  // search & vehicles
  searchVehicles,
  getVehicleByVin,
  getVehiclePhotos,
  getVehicleHistory,
  // auth
  authLogin,
  authRegister,
  authMe,
  // dealer
  dealerInventory,
};

export default api;
// also export a named `api` for files that do `import { api } from "../lib/api"`
export { api };
