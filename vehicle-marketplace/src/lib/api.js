// Tiny fetch wrapper for the frontend to call the backend.
// It reads the base URL from Vite env: VITE_API_BASE_URL
const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// Build absolute URL for an API path
export function apiUrl(path) {
  return `${BASE}${path}`;
}

// Core request helper
async function request(path, opts = {}) {
  const res = await fetch(apiUrl(path), {
    credentials: "include",
    ...opts,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// HTTP convenience methods
const http = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
  put: (path, body) =>
    request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
  del: (path) =>
    request(path, {
      method: "DELETE",
    }),
};

// Token helpers (kept for compatibility with older code)
export function setTokens(accessToken, refreshToken, role) {
  if (accessToken != null) localStorage.setItem("accessToken", accessToken);
  if (refreshToken != null) localStorage.setItem("refreshToken", refreshToken);
  if (role != null) localStorage.setItem("role", role);
}
export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
}

// Exports:
// - default: http
// - named: http, api (alias), apiUrl, setTokens, clearTokens
export const api = http; // alias so imports like { api } keep working
export { http };
export default http;
