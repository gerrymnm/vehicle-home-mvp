import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { http, setTokens, clearTokens, api } from "./api.js";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  async function fetchMe() {
    try {
      const res = await api("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchMe(); }, []);

  async function login(email, password) {
    const data = await http.post("/api/auth/login", { email, password });
    setTokens(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await http.post("/api/auth/register", payload);
    setTokens(data.access, data.refresh);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  const value = { user, loading, login, register, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (roles && !roles.includes(user.role)) return <div>Forbidden</div>;
  return children;
}
