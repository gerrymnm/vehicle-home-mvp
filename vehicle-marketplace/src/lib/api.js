// Tiny fetch wrapper for the frontend to call the backend.
// Reads base URL from Vite env: VITE_API_BASE_URL
// Exposes both default and named exports:
//   import http from "../lib/api.js";
//   import { http, api, setTokens, clearTokens } from "../lib/api.js";

const BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// Safe localStorage helpers (won't blow up during SSR/build)
const hasWindow = typeof window !== "undefined";
const storage = {
  get(k) {
    try { return hasWindow ? window.localStorage.getItem(k) : null; } catch { return null; }
  },
  set(k, v) {
    try { if (hasWindow) window.localStorage.setItem(k, v); } catch {}
  },
  del(k) {
    try { if (hasWindow) window.localStorage.removeItem(k); } catch {}
  },
};

function getAccessToken() {
  return storage.get("accessToken");
}

function toUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

async function http(path, { method = "GET", headers = {}, body, ...rest } = {}) {
  const isJsonBody =
    body && typeof body === "object" && !(body instanceof FormData);

  const auth = getAccessToken();

  const res = await fetch(toUrl(path), {
    method,
    credentials: "include",
    headers: {
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...headers,
    },
    body: isJsonBody ? JSON.stringify(body) : body,
    ...rest,
  });

  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const msg =
      (data && data.error) ||
      (typeof data === "string" ? data : res.statusText) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

http.get  = (path, opts)       => http(path, { ...opts, method: "GET" });
http.post = (path, body, opts) => http(path, { ...opts, method: "POST", body });
http.put  = (path, body, opts) => http(path, { ...opts, method: "PUT",  body });
http.del  = (path, opts)       => http(path, { ...opts, method: "DELETE" });

// Token helpers used by auth.jsx
function setTokens({ accessToken, refreshToken, role } = {}) {
  if (accessToken)  storage.set("accessToken",  accessToken);
  if (refreshToken) storage.set("refreshToken", refreshToken);
  if (role)         storage.set("role",         role);
}

function clearTokens() {
  ["accessToken", "refreshToken", "role"].forEach((k) => storage.del(k));
}

// App-specific API surface
const api = {
  search({ q = "", page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    if (q)       params.set("q", q);
    if (page)    params.set("page", String(page));
    if (pageSize)params.set("pageSize", String(pageSize));
    return http.get(`/api/search?${params.toString()}`);
  },

  vehicle(idOrVin) {
    return http.get(`/api/vehicles/${encodeURIComponent(idOrVin)}`);
  },

  leads: {
    create(payload) {
      return http.post("/api/leads", payload);
    },
  },
};

export { http, api, setTokens, clearTokens };
export default http;
