const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}
export const api = apiUrl;

export async function http(method, path, body) {
  const m = (method || "get").toLowerCase();
  const opts = { method: m.toUpperCase(), headers: {} };
  if (m !== "get" && m !== "head") {
    opts.headers["Content-Type"] = "application/json";
    if (body !== undefined) opts.body = JSON.stringify(body);
  }
  const res = await fetch(apiUrl(path), opts);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("role");
}
