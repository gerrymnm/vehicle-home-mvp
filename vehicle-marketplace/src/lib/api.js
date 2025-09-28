// vehicle-marketplace/src/lib/api.js

// Read the backend base URL from Vite env
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = RAW_BASE.replace(/\/+$/, ""); // trim trailing slash if present

function buildURL(path, query = undefined) {
  const url = new URL(
    path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/${path}`
  );
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function request(method, path, { query, body } = {}) {
  const url = buildURL(path, query);
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    // We don't need credentials for public endpoints
    mode: "cors",
  });

  const text = await res.text();

  // Try JSON first; if HTML or plain text came back, throw a helpful error
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Unexpected response (HTTP ${res.status}) from ${url}:\n${text.slice(0, 200)}`
    );
  }

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  /** Search vehicles */
  async search({ q, page = 1, pageSize = 20, dir = "asc" }) {
    const data = await request("GET", "/api/search", {
      query: { q, page, pageSize, dir },
    });
    // Expected shape: { ok, results: [...] }
    return data;
  },

  /** Get vehicle by VIN */
  async vehicle(vin) {
    const data = await request("GET", `/api/vehicles/${encodeURIComponent(vin)}`);
    // Expected shape: { ok, vehicle: {...} }
    return data;
  },

  /** Alias to match older code paths */
  async getByVin(vin) {
    return this.vehicle(vin);
  },

  /** Photos for a VIN (mocked for now) */
  async photos(vin) {
    const data = await request(
      "GET",
      `/api/vehicles/${encodeURIComponent(vin)}/photos`
    );
    // Expected shape: { ok, photos: [...] }
    return data;
  },

  /** History for a VIN, optional type filter: all | maintenance | accident | ownership */
  async history(vin, type = "all") {
    const data = await request(
      "GET",
      `/api/vehicles/${encodeURIComponent(vin)}/history`,
      { query: { type } }
    );
    // Expected shape: { ok, events: [...] }
    return data;
  },
};
