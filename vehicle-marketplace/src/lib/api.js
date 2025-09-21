export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
function getAccessToken() { if (typeof localStorage === "undefined") return null; return localStorage.getItem("vh_at") || null; }
export function setTokens(tokens = {}) { if (typeof localStorage === "undefined") return; const { accessToken, refreshToken } = tokens; if (accessToken) localStorage.setItem("vh_at", accessToken); else localStorage.removeItem("vh_at"); if (refreshToken) localStorage.setItem("vh_rt", refreshToken); else localStorage.removeItem("vh_rt"); }
export function clearTokens() { if (typeof localStorage === "undefined") return; localStorage.removeItem("vh_at"); localStorage.removeItem("vh_rt"); }
async function request(path, options = {}) { const headers = { ...(options.headers || {}) }; const at = getAccessToken(); if (at) headers.Authorization = `Bearer ${at}`; const res = await fetch(`${API_BASE}${path}`, { ...options, headers }); if (!res.ok) { let msg; try { const data = await res.json(); msg = data?.error || data?.message; } catch { msg = await res.text(); } throw new Error(msg || `${options.method || "GET"} ${path} failed (${res.status})`); } if (res.status === 204) return null; const c = res.headers.get("content-type") || ""; return c.includes("application/json") ? res.json() : res.text(); }
function get(path) { return request(path); }
function post(path, body) { return request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) }); }
function patch(path, body) { return request(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) }); }
export const http = { base: API_BASE, get, post, patch };
export const api = { base: API_BASE, request, get, post, patch, setTokens, clearTokens };
export function searchVehicles({ q = "", page = 1, sort = "relevance" } = {}) { const p = new URLSearchParams(); if (q) p.set("q", q); if (page) p.set("page", String(page)); if (sort) p.set("sort", sort); return get(`/search?${p.toString()}`); }
export function fetchVehicleByVin(vin) { return get(`/vehicles/${encodeURIComponent(vin)}`); }
export function createLead(payload) { return post(`/api/leads`, payload); }
export function fetchDealerLeads() { return get(`/dealer/leads`); }
export function updateLead(id, data) { return patch(`/dealer/leads/${id}`, data); }
