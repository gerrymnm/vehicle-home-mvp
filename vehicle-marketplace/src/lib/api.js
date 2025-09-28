// Full file: vehicle-marketplace/src/lib/api.js

const BASE =
  import.meta.env.VITE_API_BASE?.trim() ||
  process.env.VITE_API_BASE?.trim() ||
  "https://vehicle-home-mvp.onrender.com/api";

/* ---------- tiny HTTP helper ---------- */
async function http(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include", // allow cookies if we add auth later
  });

  // Try JSON first; if HTML came back (e.g., an error page), throw a helpful error.
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  } catch {
    if (!res.ok) {
      throw new Error(`Unexpected response (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }
    throw new Error("Response was not JSON.");
  }
}

/* ---------- canonical API (explicit names) ---------- */
export async function searchVehicles(q = "", page = 1) {
  const params = new URLSearchParams({ q, page: String(page) });
  return http(`/search?${params.toString()}`);
}

export async function getVehicle(vin) {
  if (!vin) throw new Error("VIN is required");
  return http(`/vehicles/${encodeURIComponent(vin)}`);
}

export async function getVehiclePhotos(vin) {
  if (!vin) throw new Error("VIN is required");
  return http(`/vin/photos?vin=${encodeURIComponent(vin)}`);
}

export async function getVehicleHistory(vin, type = "all") {
  if (!vin) throw new Error("VIN is required");
  const params = new URLSearchParams({ vin, type });
  return http(`/vin/history?${params.toString()}`);
}

/* ---------- auth helpers (stubs for now) ---------- */
export async function signin(email, password) {
  return http("/auth/login", { method: "POST", body: { email, password } });
}
export async function signup(payload) {
  return http("/auth/register", { method: "POST", body: payload });
}
export async function me() {
  return http("/auth/me");
}
export async function signout() {
  return http("/auth/logout", { method: "POST" });
}

/* ---------- compatibility aliases ---------- */
/* These give you the short names your UI uses: api.vehicle(), api.photos(), api.history(), api.search() */
export async function search(q, page = 1) {
  return searchVehicles(q, page);
}
export async function vehicle(vin) {
  return getVehicle(vin);
}
export async function photos(vin) {
  return getVehiclePhotos(vin);
}
export async function history(vin, type = "all") {
  return getVehicleHistory(vin, type);
}

/* ---------- default export collects everything ---------- */
const api = {
  BASE,
  http,
  // explicit
  searchVehicles,
  getVehicle,
  getVehiclePhotos,
  getVehicleHistory,
  // aliases used by pages/components
  search,
  vehicle,
  photos,
  history,
  // auth
  signin,
  signup,
  me,
  signout,
};

export default api;
export { api }; // also export named, so `import { api }` works
