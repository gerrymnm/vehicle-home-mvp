// Full file: vehicle-marketplace/src/lib/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (window && window.__API_BASE__) ??
  "https://vehicle-home-mvp.onrender.com/api";

function token() {
  try { return localStorage.getItem("vh_token") || ""; } catch { return ""; }
}

async function http(path, { method = "GET", headers = {}, body, timeoutMs = 15000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  const hdrs = { "Accept": "application/json", ...headers };
  const tk = token();
  if (tk) hdrs["Authorization"] = `Bearer ${tk}`;
  if (body && !("Content-Type" in hdrs)) hdrs["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method, headers: hdrs, body, signal: ctrl.signal, credentials: "omit",
  }).catch((e) => { clearTimeout(t); throw e; });

  clearTimeout(t);

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch {
    // If HTML or plain text comes back, surface it as an error payload
    data = { ok: false, error: text || `HTTP ${res.status}` };
  }

  if (!res.ok || data?.ok === false) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/* ------------ Public API helpers (named exports) ------------- */

// Search
export async function searchVehicles({ q, page = 1, pageSize = 20, dir = "asc" }) {
  const params = new URLSearchParams({ q: q ?? "", page: String(page), pageSize: String(pageSize), dir });
  return http(`/search?${params.toString()}`);
}

// Details
export async function getVehicleByVin(vin) {
  return http(`/vehicles/${encodeURIComponent(vin)}`);
}

// Auth
export async function authRegister({ name, email, password }) {
  return http(`/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function authLogin({ email, password }) {
  return http(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function authMe() {
  return http(`/auth/me`);
}

/* Dealer examples (skeleton-ready; you can back these with real endpoints later) */
export async function dealerInventory({ page = 1, pageSize = 25 } = {}) {
  // If you later build a real endpoint, swap this to: return http(`/dealer/inventory?...`);
  // For now we’ll just return an empty structure the UI can render.
  return { ok: true, items: [], page, pageSize, total: 0, totalPages: 1 };
}
