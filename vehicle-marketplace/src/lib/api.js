// vehicle-marketplace/src/lib/api.js

const BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function toUrl(path) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${clean}`;
}

/** Core fetch with good errors */
export async function http(path, opts = {}) {
  const url = toUrl(path);

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",      // keep for future auth
    mode: "cors",
  });

  if (!res.ok) {
    // capture server text to help debugging
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

/** Convenience API */
export const api = {
  search: ({ q, page = 1, pageSize = 20, dir = "asc" }) => {
    const qs = new URLSearchParams({ q, page, pageSize, dir }).toString();
    return http(`/api/search?${qs}`);
  },
  vehicleByVin: (vin) => http(`/api/vehicles/${encodeURIComponent(vin)}`),
};
