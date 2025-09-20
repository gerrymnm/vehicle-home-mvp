// vehicle-marketplace/src/lib/vehicleApis.js

/**
 * API helper functions for vehicle data
 * Frontend uses these to talk to the backend (/api/... routes).
 */

export async function fetchVehicleFull(vin) {
  const res = await fetch(`/api/vehicles/${vin}/full`);
  if (!res.ok) throw new Error(`Failed to fetch vehicle ${vin}`);
  return await res.json();
}

/**
 * Search vehicles by natural language query
 * Example: "electric car under 30k"
 */
export async function searchVehicles(query) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return await res.json();
}

/**
 * Fetch inventory (all vehicles) — mostly for debugging/demo.
 */
export async function fetchInventory() {
  const res = await fetch(`/api/inventory`);
  if (!res.ok) throw new Error(`Failed to fetch inventory`);
  return await res.json();
}
