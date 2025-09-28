// Full file: vehicle-marketplace/src/lib/api.js

const BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/+$/, "") ||
  (typeof window !== "undefined" ? `${location.origin.replace(/\/+$/,"")}/api` : "/api");

// --- helpers -------------------------------------------------------------

async function jsonOrThrow(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // not JSON (e.g., HTML error page)
  }
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
  const u = new URL(url, "http://x"); // base to use URL API
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    u.searchParams.set(k, String(v));
  });
  // strip the fake base
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

// NOTE: Your backend serves photos at /api/vin/photos?vin=...
async function vehiclePhotos(vin) {
  const path = withQuery(`${BASE}/vin/photos`, { vin });
  try {
    const res = await fetch(path, { credentials: "omit" });
    const data = await jsonOrThrow(res);
    // normalize: expect { photos: string[] } or { ok:true, photos:[...] }
    const photos = Array.isArray(data?.photos) ? data.photos : [];
    return { ok: true, photos };
  } catch (e) {
    // if photos aren’t provided, just return none without breaking the page
    return { ok: false, error: e.message, photos: [] };
  }
}

// NOTE: Your backend serves history at /api/vin/history?vin=...&type=...
// If the server returns 404 for unknown VIN/history, we convert that into an empty history.
async function getVehicleHistory(vin, type = "all") {
  const path = withQuery(`${BASE}/vin/history`, { vin, type });
  try {
    const res = await fetch(path, { credentials: "omit" });
    if (res.status === 404) {
      // Treat as empty history
      return { ok: true, type, count: 0, events: [] };
    }
    const data = await jsonOrThrow(res);
    const events = Array.isArray(data?.events) ? data.events : [];
    return { ok: true, type: data?.type ?? type, count: events.length, events };
  } catch (e) {
    // Surface a clean error object; History.jsx will render the message
    return { ok: false, error: e.message, type, count: 0, events: [] };
  }
}

// --- auth (frontend-only helper thin wrappers) ---------------------------

async function authLogin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return jsonOrThrow(res); // { ok:true, access, refresh, user }
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

// default export + named exports
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
