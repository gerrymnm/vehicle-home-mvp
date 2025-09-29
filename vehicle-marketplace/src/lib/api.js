// vehicle-marketplace/src/lib/api.js

const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

// internal helper
async function fetchJson(path, opts = {}) {
  const url = `${BASE}/${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j?.error || detail;
    } catch {}
    throw new Error(detail || "Request failed");
  }
  return res.json();
}

// Accepts either a string ("mazda"), URLSearchParams, or a plain object { q, page, pagesize }
export function searchVehicles(qOrParams) {
  let usp;
  if (typeof qOrParams === "string") {
    usp = new URLSearchParams({ q: qOrParams });
  } else if (qOrParams instanceof URLSearchParams) {
    usp = qOrParams;
  } else if (qOrParams && typeof qOrParams === "object") {
    // if q is itself an object (buggy callers), try to extract a string
    let params = { ...qOrParams };
    if (params.q && typeof params.q !== "string") {
      // try common shapes
      if (params.q.get && typeof params.q.get === "function") {
        params.q = params.q.get("q") || "";
      } else if (typeof params.q.q === "string") {
        params.q = params.q.q;
      } else {
        params.q = String(params.q);
      }
    }
    usp = new URLSearchParams(params);
  } else {
    usp = new URLSearchParams();
  }
  return fetchJson(`search?${usp.toString()}`);
}

export function getVehicle(vin) {
  return fetchJson(`vehicles/${encodeURIComponent(vin)}`);
}

export function getVehicleHistory(vin, type = "all") {
  const usp = new URLSearchParams({ type });
  return fetchJson(`vin/history?vin=${encodeURIComponent(vin)}&${usp.toString()}`);
}

const api = { searchVehicles, getVehicle, getVehicleHistory };
export default api;
