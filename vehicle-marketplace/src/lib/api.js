const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}
export const api = apiUrl;

async function request(method, path, body) {
  const m = method.toUpperCase();
  const opts = { method: m, headers: {} };
  if (m !== "GET" && m !== "HEAD") {
    opts.headers["Content-Type"] = "application/json";
    if (body !== undefined) opts.body = JSON.stringify(body);
  }
  const res = await fetch(apiUrl(path), opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || String(res.status));
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const http = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path, body) => request("DELETE", path, body),
  delete: (path, body) => request("DELETE", path, body),
};

export function setTokens({ accessToken, refreshToken, role } = {}) {
  if (accessToken != null) localStorage.setItem("accessToken", accessToken);
  if (refreshToken != null) localStorage.setItem("refreshToken", refreshToken);
  if (role != null) localStorage.setItem("role", role);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
}
