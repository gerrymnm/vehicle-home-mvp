const BASE =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "https://vehicle-home-mvp.onrender.com";

async function request(method, path, body, params) {
  let url = BASE + path;
  if (params) {
    const usp = new URLSearchParams(params);
    url += "?" + usp.toString();
  }
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const http = {
  get: (path, params) => request("GET", path, null, params),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path) => request("DELETE", path),
};

export const api = http;
export function apiUrl(p) { return BASE + p; }
export function setTokens() {}
export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
}
