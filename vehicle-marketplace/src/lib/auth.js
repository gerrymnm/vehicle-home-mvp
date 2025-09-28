// Full file: vehicle-marketplace/src/lib/auth.js

import api from "./api.js";

/**
 * Thin auth wrappers that delegate to the backend via api.js.
 * api.js already sets credentials: "include" so cookies (if any) flow.
 */

export async function login(email, password) {
  if (!email || !password) throw new Error("Email and password are required");
  return api.signin(email, password);
}

export async function register(payload) {
  if (!payload?.email || !payload?.password) {
    throw new Error("Email and password are required");
  }
  return api.signup(payload);
}

export async function me() {
  return api.me();
}

export async function logout() {
  return api.signout();
}

/**
 * Default export bundling everything, in case callers prefer `auth.login(...)`.
 */
const auth = { login, register, me, logout };
export default auth;
