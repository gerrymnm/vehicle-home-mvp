// Full file: vehicle-marketplace/src/lib/auth.js
import { authLogin, authRegister, authMe } from "./api";

const KEY = "vh_token";
const PROFILE = "vh_user";

export function getToken() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}
export function setToken(t) {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {}
}

export function getUser() {
  try {
    const raw = localStorage.getItem(PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setUser(u) {
  try {
    if (u) localStorage.setItem(PROFILE, JSON.stringify(u));
    else localStorage.removeItem(PROFILE);
  } catch {}
}

export async function doRegister({ name, email, password }) {
  const res = await authRegister({ name, email, password });
  // If backend returns tokens here, store them; if not, direct to login.
  if (res?.access) setToken(res.access);
  if (res?.user) setUser(res.user);
  return res;
}

export async function doLogin({ email, password }) {
  const res = await authLogin({ email, password });
  if (res?.access) setToken(res.access);
  if (res?.user) setUser(res.user);
  return res;
}

export async function refreshProfile() {
  try {
    const me = await authMe();
    if (me?.user) setUser(me.user);
    return me?.user ?? null;
  } catch {
    // invalid token
    setToken("");
    setUser(null);
    return null;
  }
}

export function logout() {
  setToken("");
  setUser(null);
}
