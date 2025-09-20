const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:8080";

const TOKEN_KEYS = { access: "access", refresh: "refresh" };

export function getAccess() {
  return localStorage.getItem(TOKEN_KEYS.access) || "";
}
export function getRefresh() {
  return localStorage.getItem(TOKEN_KEYS.refresh) || "";
}
export function setTokens(access, refresh) {
  if (access) localStorage.setItem(TOKEN_KEYS.access, access);
  if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh);
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
}

async function rawFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) headers.set("Content-Type", "application/json");
  const access = getAccess();
  if (access && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${access}`);

  const res = await fetch(url, { ...opts, headers });
  return res;
}

/** Fetch with automatic refresh-on-401 (one retry) */
export async function api(path, opts = {}) {
  let res = await rawFetch(path, opts);
  if (res.status !== 401) return res;

  // try refresh once
  const refresh = getRefresh();
  if (!refresh) return res;

  const rr = await rawFetch("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh }),
    headers: { "Content-Type": "application/json" }
  });

  if (rr.ok) {
    const data = await rr.json();
    if (data.access) {
      setTokens(data.access, refresh);
      res = await rawFetch(path, opts); // retry original
    }
  }
  return res;
}

export const http = {
  async get(path) {
    const r = await api(path, { method: "GET" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(path, body) {
    const r = await api(path, { method: "POST", body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async patch(path, body) {
    const r = await api(path, { method: "PATCH", body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(path) {
    const r = await api(path, { method: "DELETE" });
    if (!r.ok && r.status !== 204) throw new Error(await r.text());
    return r.status === 204 ? {} : r.json();
  }
};
