// Full file: vehicle-marketplace/src/lib/api.js

// Hard-coded API base (works without env), but still honors VITE_API_BASE if set:
const FALLBACK_BASE = "https://vehicle-home-mvp.onrender.com/api";
const BASE =
  (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.replace(/\/+$/, "")) ||
  FALLBACK_BASE;

// --- helpers -------------------------------------------------------------

async function jsonOrThrow(res) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = data ?? text;
    throw err;
  }
  return data;
}

function withQuery(url, params) {
  const u = new URL(url, "http://x");
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    u.searchParams.set(k, String(v));
  });
  return u.pathname + (u.search || "");
}

// --- public API ----------------------------------------------------------

async function searchVehicles(q, page = 1, pagesize = 20) {
  const path = withQuery(`${BASE}/search`, { q, page, pagesize });
  const res = await fetch(path, { credentials: "omit" });
  return jsonOrThrow(res);
}

async function vehicle(vin) {
  const res = await fetch(`${BASE}/vehicles/${encodeURIComponent(vin)}`, {
    credentials: "omit",
  });
  return jsonOrThrow(res);
}

// Backend routes for photos & history are /api/vin/*
async function vehiclePhotos(vin) {
  const path = withQuery(`${BASE}/vin/photos`, { vin });
  try {
    const res = await fetch(path, { credentials: "omit" });
    const data = await jsonOrThrow(res);
    const photos = Array.isArray(data?.photos) ? data.photos : [];
    return { ok: true, photos };
  } catch (e) {
    return { ok: false, error: e.message, photos: [] };
  }
}

async function getVehicleHistory(vin, type = "all") {
  const path = withQuery(`${BASE}/vin/history`, { vin, type });
  try {
    const res = await fetch(path, { credentials: "omit" });
    if (res.status === 404) return { ok: true, type, count: 0, events: [] };
    const data = await jsonOrThrow(res);
    const events = Array.isArray(data?.events) ? data.events : [];
    return { ok: true, type: data?.type ?? type, count: events.length, events };
  } catch (e) {
    return { ok: false, error: e.message, type, count: 0, events: [] };
  }
}

// --- auth ---------------------------------------------------------------

async function authLogin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return jsonOrThrow(res);
}

async function authRegister(email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return jsonOrThrow(res);
}

async function authMe(token) {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
  return jsonOrThrow(res);
}

const api = {
  searchVehicles,
  vehicle,
  vehiclePhotos,
  getVehicleHistory,
  authLogin,
  authRegister,
  authMe,
};

export default api;
export {
  searchVehicles,
  vehicle,
  vehiclePhotos,
  getVehicleHistory,
  authLogin,
  authRegister,
  authMe,
  api,
};
