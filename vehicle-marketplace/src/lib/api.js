// Full file: vehicle-marketplace/src/lib/api.js
const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, ""); // must include /api
if (!BASE) {
  console.warn("VITE_API_BASE is not set; API calls will fail.");
}

async function doFetch(path, opts = {}, retry = true) {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    if (!res.ok) {
      // Try to parse JSON error; fallback to status text
      let detail = res.statusText;
      try {
        const j = await res.json();
        detail = j?.error || detail;
      } catch {}
      throw new Error(`${res.status} ${detail}`.trim());
    }
    return res.json();
  } catch (err) {
    // Help when Render is cold: retry once after a short delay
    if (retry) {
      await new Promise(r => setTimeout(r, 1200));
      return doFetch(path, opts, false);
    }
    throw err;
  }
}

export default {
  async searchVehicles({ q, page = 1, pagesize = 20 }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(page));
    params.set("pagesize", String(pagesize));
    const data = await doFetch(`/vehicles/search?${params.toString()}`);
    if (!data?.ok) throw new Error(data?.error || "Search failed");
    return data;
  },

  async getByVin(vin) {
    const data = await doFetch(`/vehicles/${encodeURIComponent(vin)}`);
    if (!data?.ok) throw new Error(data?.error || "Lookup failed");
    return data.vehicle;
  },

  async getVehiclePhotos(vin) {
    const data = await doFetch(`/vehicles/vin/photos?vin=${encodeURIComponent(vin)}`);
    if (!data?.ok) throw new Error(data?.error || "Photos failed");
    return data.photos || [];
  },

  async getVehicleHistory(vin, type = "all") {
    const params = new URLSearchParams({ vin, type });
    const data = await doFetch(`/vehicles/vin/history?${params.toString()}`);
    if (!data?.ok) throw new Error(data?.error || "History failed");
    return data.events || [];
  },

  // Auth (if you’re using it)
  async authLogin(payload) {
    const data = await doFetch(`/auth/login`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!data?.ok) throw new Error(data?.error || "Login failed");
    return data;
  },

  async authRegister(payload) {
    const data = await doFetch(`/auth/register`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!data?.ok) throw new Error(data?.error || "Register failed");
    return data;
  },

  async authMe(token) {
    const data = await doFetch(`/auth/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!data?.ok) throw new Error(data?.error || "Auth check failed");
    return data;
  },
};

export const { searchVehicles, getByVin, getVehiclePhotos, getVehicleHistory, authLogin, authRegister, authMe } = (/** @type {any} */ (default));
