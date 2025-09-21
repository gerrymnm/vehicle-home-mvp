// vehicle-marketplace/src/lib/api.js
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

/** Basic JSON fetch helpers */
async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `GET ${path} failed with ${res.status}`);
  }
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `POST ${path} failed with ${res.status}`);
  }
  return res.json();
}

/** Public API */
export function fetchVehicleByVin(vin) {
  // Your backend router is mounted at root: GET /vehicles/:vin
  return getJSON(`/vehicles/${encodeURIComponent(vin)}`);
}

export function createLead(payload) {
  // POST /api/leads  { vin, name, email?, phone?, message? }
  return postJSON(`/api/leads`, payload);
}
