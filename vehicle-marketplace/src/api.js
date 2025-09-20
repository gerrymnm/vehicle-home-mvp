const API = "/api";

function toParams(obj = {}) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  return p.toString();
}

export async function fetchVehicles(opts = {}) {
  const qs = toParams(opts);
  const res = await fetch(`${API}/vehicles${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`vehicles ${res.status}`);
  return res.json(); // { query, count, total, totalPages, results }
}

export async function fetchVehicle(vin) {
  const res = await fetch(`${API}/vehicles/${encodeURIComponent(vin)}`);
  if (!res.ok) throw new Error(`vehicle ${res.status}`);
  return res.json();
}

export async function fetchMetrics(opts = {}) {
  const qs = toParams(opts);
  const res = await fetch(`${API}/metrics/summary${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`metrics ${res.status}`);
  return res.json(); // MetricsSummary
}
