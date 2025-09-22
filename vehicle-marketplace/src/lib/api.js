// Tiny fetch wrapper for the frontend to call the backend.
// It reads the base URL from Vite env: VITE_API_BASE_URL
// Works with both default and named imports:
//   import http from "../lib/api.js";
//   import { http, api } from "../lib/api.js";

const BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

async function http(path, { method = "GET", headers = {}, body, ...rest } = {}) {
  const isJsonBody =
    body && typeof body === "object" && !(body instanceof FormData);

  const res = await fetch(buildUrl(path), {
    method,
    credentials: "include",
    headers: {
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
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

http.get = (path, opts) => http(path, { ...opts, method: "GET" });
http.post = (path, body, opts) => http(path, { ...opts, method: "POST", body });
http.put = (path, body, opts) => http(path, { ...opts, method: "PUT", body });
http.del = (path, opts) => http(path, { ...opts, method: "DELETE" });

// Convenience API surface for the app
const api = {
  search({ q = "", page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (page) params.set("page", String(page));
    if (pageSize) params.set("pageSize", String(pageSize));
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

export { http, api };
export default http;
