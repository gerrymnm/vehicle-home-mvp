// vehicle-marketplace/src/lib/api.js

// IMPORTANT: VITE_API_BASE must include the /api suffix, e.g.
//   https://vehicle-home-mvp.onrender.com/api
const RAW_BASE = import.meta.env.VITE_API_BASE || "";
const BASE = RAW_BASE.replace(/\/+$/, ""); // trim trailing slash(es)

// Centralized fetch helper
async function dofetch(path, opts = {}) {
  if (!BASE) {
    throw new Error("VITE_API_BASE is not set");
  }
  const url = path.startsWith("/") ? `${BASE}${path}` : `${BASE}/${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });

  // Try to parse JSON either way
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore JSON parse failure for non-JSON responses
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data;
}

/* -------------------- Public read endpoints -------------------- */

export function searchVehicles(query, page = 1) {
  const q = String(query || "").trim();
  const p = Number(page) || 1;
  return dofetch(`/search?q=${encodeURIComponent(q)}&page=${p}`);
}

export function getVehicleByVin(vin) {
  return dofetch(`/vehicles/${encodeURIComponent(vin)}`);
}

export function getVehiclePhotos(vin) {
  return dofetch(`/vin/photos/${encodeURIComponent(vin)}`);
}

export function getVehicleHistory(vin, type = "all") {
  const t = String(type || "all");
  return dofetch(`/vin/history/${encodeURIComponent(vin)}?type=${encodeURIComponent(t)}`);
}

/* -------------------- Auth endpoints -------------------- */

export function authLogin(email, password) {
  return dofetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function authRegister(name, email, password) {
  return dofetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function authMe(token) {
  return dofetch("/auth/me", {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

/* -------------------- default export (optional convenience) -------------------- */

const api = {
  searchVehicles,
  getVehicleByVin,
  getVehiclePhotos,
  getVehicleHistory,
  authLogin,
  authRegister,
  authMe,
};

export default api;
