const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

let tokenCache = {
  accessToken: localStorage.getItem('accessToken') || '',
  refreshToken: localStorage.getItem('refreshToken') || '',
  role: localStorage.getItem('role') || '',
};

function authHeader() {
  return tokenCache.accessToken ? { Authorization: `Bearer ${tokenCache.accessToken}` } : {};
}

async function request(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  if (r.status === 204) return {};
  const ct = r.headers.get('content-type') || '';
  return ct.includes('application/json') ? r.json() : r.text();
}

async function get(path) { return request('GET', path); }
async function post(path, body) { return request('POST', path, body); }
async function put(path, body) { return request('PUT', path, body); }
async function del(path) { return request('DELETE', path); }

export function setTokens({ accessToken = '', refreshToken = '', role = '' } = {}) {
  tokenCache = { accessToken, refreshToken, role };
  if (accessToken) localStorage.setItem('accessToken', accessToken); else localStorage.removeItem('accessToken');
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken); else localStorage.removeItem('refreshToken');
  if (role) localStorage.setItem('role', role); else localStorage.removeItem('role');
}

export function clearTokens() {
  tokenCache = { accessToken: '', refreshToken: '', role: '' };
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('role');
}

export const http = { get, post, put, del };
export const api = http;
export function apiUrl(path) { return `${BASE}${path}`; }
