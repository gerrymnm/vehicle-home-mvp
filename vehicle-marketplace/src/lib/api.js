// Full file: vehicle-marketplace/src/lib/api.js
const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

function buildURL(path, params) {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

async function getJSON(url, init) {
  const res = await fetch(url, { ...init, credentials: "omit" });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch {
    throw new Error(`Unexpected response (${res.status}): ${text.slice(0, 120)}…`);
  }
  if (!res.ok || data.ok === false || data.error) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function searchVehicles({ q, page = 1, pageSize = 20 }) {
  const url = buildURL("/api/search", { q, page, pageSize });
  return getJSON(url);
}

export async function getVehicle(vin) {
  const url = buildURL(`/api/vehicles/${encodeURIComponent(vin)}`);
  return getJSON(url);
}

export async function getVehiclePhotos(vin) {
  const url = buildURL(`/api/vehicles/${encodeURIComponent(vin)}/photos`);
  return getJSON(url);
}

export async function getVehicleHistory(vin, type = "all") {
  const url = buildURL(`/api/vehicles/${encodeURIComponent(vin)}/history`, { type });
  return getJSON(url);
}
