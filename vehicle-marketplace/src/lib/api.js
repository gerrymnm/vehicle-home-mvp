// Tiny fetch wrapper for the frontend to call the backend.
// Reads base URL from Vite env: VITE_API_BASE_URL (e.g. https://vehicle-home-mvp.onrender.com)

const BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL &&
    String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")) ||
  "";

// Core request helper
async function request(path, { method = "GET", data, headers } = {}) {
  const url = `${BASE}${path}`;
  const init = {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    credentials: "omit",
    body: data ? JSON.stringify(data) : undefined,
  };

  const res = await fetch(url, init);
  const isJSON = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg =
      (isJSON && (body.error || body.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return body;
}

// Public API used throughout the app
export const api = {
  // Search inventory
  search({ q = "", page = 1, pageSize = 20, dir = "asc" } = {}) {
    const params = new URLSearchParams({
      q,
      page: String(page),
      pagesize: String(pageSize),
      dir,
    });
    return request(`/api/search?${params.toString()}`);
  },

  // Health check (optional)
  health() {
    return request(`/api/health`);
  },

  // Vehicle-related calls
  vehicles: {
    // Fetch a single vehicle by VIN for the VDP
    getByVin(vin) {
      if (!vin) throw new Error("VIN required");
      return request(`/api/vehicles/${encodeURIComponent(vin)}`);
    },
  },
};
