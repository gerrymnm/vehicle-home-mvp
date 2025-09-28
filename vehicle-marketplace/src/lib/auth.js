// Full file: vehicle-marketplace/src/lib/auth.js
import api, { authLogin, authRegister, authMe } from "./api.js";

const KEY = "vh_token";

export function getToken() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {}
}

export async function login({ email, password }) {
  const res = await authLogin({ email, password });
  // expect { ok, user, access, refresh } from backend
  if (!res || res.ok === false) throw new Error(res?.error || "Login failed");
  if (res.access) setToken(res.access);
  return res;
}

export async function register({ name, email, password }) {
  const res = await authRegister({ name, email, password });
  if (!res || res.ok === false) throw new Error(res?.error || "Register failed");
  if (res.access) setToken(res.access);
  return res;
}

export async function me() {
  try {
    const res = await authMe();
    return res?.user ?? null;
  } catch {
    return null;
  }
}

export function logout() {
  setToken("");
}

export default { login, register, me, logout, getToken, setToken, api };
