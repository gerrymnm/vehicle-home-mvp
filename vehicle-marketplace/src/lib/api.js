const BASE =
  (typeof import !== "undefined" &&
    import.meta &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== "undefined" && window.__BASE__) ||
  "https://vehicle-home-mvp.onrender.com";

async function get(path, params) {
  const url = new URL(BASE + path);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function put(path, body) {
  const res = await fetch(BASE + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del(path) {
  const res = await fetch(BASE + path, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const http = { get, post, put, del };
export const api = http;
export function apiUrl(p) { return BASE + p; }
