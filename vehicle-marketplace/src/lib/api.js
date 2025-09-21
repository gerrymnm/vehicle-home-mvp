const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

function getToken() {
  try {
    return localStorage.getItem("access_token") || "";
  } catch {
    return "";
  }
}

export async function http(path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  const tok = getToken();
  if (tok) headers.set("Authorization", `Bearer ${tok}`);
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw Object.assign(new Error("HTTP"), { status: res.status, data });
  return data;
}

export function setTokens({ access_token, refresh_token }) {
  localStorage.setItem("access_token", access_token || "");
  if (refresh_token != null) localStorage.setItem("refresh_token", refresh_token || "");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export const api = {
  search: (q, page = 1, sort = "") =>
    http(`/api/search?q=${encodeURIComponent(q || "")}&page=${page}&sort=${encodeURIComponent(sort)}`),
  vehicleByVin: (vin) => http(`/api/vehicles/${encodeURIComponent(vin)}`),
  myInventory: () => http(`/api/vehicles?mine=1`),
  upsertVehicle: (payload) => http(`/api/vehicles`, { method: "POST", body: JSON.stringify(payload) }),
  markSold: (vin, note = "") => http(`/api/vehicles/${encodeURIComponent(vin)}/sold`, { method: "POST", body: JSON.stringify({ note }) }),
  unmarkSold: (vin) => http(`/api/vehicles/${encodeURIComponent(vin)}/sold`, { method: "DELETE" }),
  deleteVehicle: (vin) => http(`/api/vehicles/${encodeURIComponent(vin)}`, { method: "DELETE" }),
  createLead: (payload) => http(`/api/leads`, { method: "POST", body: JSON.stringify(payload) }),
  listLeads: () => http(`/api/leads`),
  setLeadStatus: (id, status) => http(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
};
