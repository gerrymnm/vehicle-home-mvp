import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// Self-contained tiny fetch wrapper (doesn't rely on api.js)
const BASE = import.meta?.env?.VITE_API_BASE_URL || "";

async function http(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

const AuthCtx = React.createContext({
  user: null,
  ready: false,
  login: async (_payload) => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [ready, setReady] = React.useState(false);

  // Try to fetch the current user (if already logged in)
  React.useEffect(() => {
    (async () => {
      try {
        const me = await http("/api/auth/me");
        setUser(me?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = async (payload) => {
    // payload: { email, password } or whatever your backend expects
    const r = await http("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setUser(r?.user ?? null);
    return r;
  };

  const logout = async () => {
    // If you add a /api/auth/logout later, call it here. For now just clear.
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthCtx);
}

export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null; // or a loader
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
