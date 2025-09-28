// Full file: vehicle-marketplace/src/components/Protected.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUser, refreshProfile } from "../lib/auth";

export default function Protected({ children }) {
  const loc = useLocation();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await refreshProfile();
      if (alive) { setUser(u); setChecking(false); }
    })();
    return () => { alive = false; };
  }, []);

  if (checking) return <p>Checking session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ redirectTo: loc.pathname + loc.search }} />;
  return children;
}
