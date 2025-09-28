// vehicle-marketplace/src/lib/api.js

// Backend base URL from Vite env
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = RAW_BASE.replace(/\/+$/, ""); // trim trailing slash

function buildURL(path, query) {
  const url = new URL(
    path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/${path}`
  );
  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function request(method, path, { query, body } = {}) {
  const url = buildURL(path, query);
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    mode: "cors",
  });

  const text = await res.text();
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
  async search({ q, page = 1, pageSize = 20, dir = "asc" }) {
    return request("GET", "/api/search", { query: { q, page, pageSize, dir } });
  },
  async vehicle(vin) {
    return request("GET", `/api/vehicles/${encodeURIComponent(vin)}`);
  },
  async getByVin(vin) {
    return this.vehicle(vin);
  },
  async photos(vin) {
    return request("GET", `/api/vehicles/${encodeURIComponent(vin)}/photos`);
  },
  async history(vin, type = "all") {
    return request("GET", `/api/vehicles/${encodeURIComponent(vin)}/history`, {
      query: { type },
    });
  },
};

// Compatibility aliases for older imports
export const http = api;            // some files do: import http from "../lib/api.js"
export const getByVin = api.getByVin;

// Default export so `import api from ...` works
export default api;
