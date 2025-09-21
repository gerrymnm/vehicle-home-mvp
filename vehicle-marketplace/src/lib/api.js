// vehicle-marketplace/src/lib/api.js

// Base URL for the backend API (Render in prod, localhost in dev)
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

// Generic request helper
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    // try to surface backend error message
    let msg;
    try {
      const data = await res.json();
      msg = data?.error || data?.message;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg || `${options.method || "GET"} ${path} failed (${res.status})`);
  }
  // allow empty 204 responses
  if (res.status === 204) return null;
  return res.json();
}

// Export an http object so existing imports like `import { http } from "../lib/api.js"` keep working
export const http = {
  base: API_BASE,
  get(path) {
    return request(path);
  },
  post(path, body) {
    return request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  },
};

// Convenience domain helpers
export function searchVehicles({ q = "", page = 1, sort = "relevance" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page) params.set("page", String(page));
  if (sort) params.set("sort", sort);
  return http.get(`/search?${params.toString()}`);
}

export function fetchVehicleByVin(vin) {
  return http.get(`/vehicles/${encodeURIComponent(vin)}`);
}

export function createLead(payload) {
  // { vin, name, email?, phone?, message? }
  return http.post(`/api/leads`, payload);
}
