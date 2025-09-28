// Full file: vehicle-marketplace/src/lib/api.js

// ----- Backend base URL -----
// Set VITE_BACKEND_URL in Vercel → Project → Settings → Environment Variables
const BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_BACKEND_URL) ||
  "https://vehicle-home-mvp.onrender.com";

// ----- tiny fetch helpers -----
async function req(path, { method = "GET", headers = {}, body } = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body !== undefined) init.body = typeof body === "string" ? body : JSON.stringify(body);

  const r = await fetch(url, init);
  // if server ever serves HTML on error, show a useful message
  const ct = r.headers.get("content-type") || "";
  if (!r.ok) {
    if (ct.includes("application/json")) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || j.message || `HTTP ${r.status}`);
    } else {
      const t = await r.text().catch(() => "");
      throw new Error(t || `HTTP ${r.status}`);
    }
  }
  return ct.includes("application/json") ? r.json() : r.text();
}

// expose a convenience "http" bag (kept for older imports)
export const http = {
  get: (p) => req(p, { method: "GET" }),
  post: (p, body, headers) => req(p, { method: "POST", body, headers }),
};

// ----- marketplace search / vehicle -----
export async function searchVehicles({ q = "", page = 1, pageSize = 20, dir = "asc" } = {}) {
  const u = new URL(`${BASE}/api/search`);
  if (q) u.searchParams.set("q", q);
  u.searchParams.set("page", String(page));
  u.searchParams.set("pageSize", String(pageSize));
  u.searchParams.set("dir", dir);
  return req(u.toString(), { method: "GET" });
}

export async function getVehicle(vin) {
  return req(`/api/vehicles/${encodeURIComponent(vin)}`, { method: "GET" });
}

export async function getVehiclePhotos(vin) {
  return req(`/api/vehicles/${encodeURIComponent(vin)}/photos`, { method: "GET" });
}

export async function getVehicleHistory(vin, type = "all") {
  const u = new URL(`${BASE}/api/vehicles/${encodeURIComponent(vin)}/history`);
  if (type) u.searchParams.set("type", type);
  return req(u.toString(), { method: "GET" });
}

// ----- auth helpers (JWT) -----
function token() {
  try { return localStorage.getItem("vh_token") || ""; } catch { return ""; }
}
function authHeaders() {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function authRegister({ name, email, password }) {
  return req("/api/auth/register", { method: "POST", body: { name, email, password } });
}
export async function authLogin({ email, password }) {
  return req("/api/auth/login", { method: "POST", body: { email, password } });
}
export async function authMe() {
  return req("/api/auth/me", { method: "GET", headers: authHeaders() });
}

// ----- dealer stubs (wire to real endpoints later) -----
export async function dealerInventory({ page = 1, pageSize = 25 } = {}) {
  // placeholder shape to keep UI happy until backend endpoint exists
  return { items: [], page, pageSize, total: 0, totalPages: 1, ok: true };
}

// ----- default export (for default-import users) -----
const api = {
  http,
  searchVehicles,
  getVehicle,
  getVehiclePhotos,
  getVehicleHistory,
  authRegister,
  authLogin,
  authMe,
  dealerInventory,
};
export default api;
