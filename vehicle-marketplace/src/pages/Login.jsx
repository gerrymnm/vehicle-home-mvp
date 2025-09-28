// Full file: vehicle-marketplace/src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { doLogin } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.redirectTo || "/dealer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await doLogin({ email, password });
      nav(redirectTo, { replace: true });
    } catch (e2) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Log in</h2>
      <form onSubmit={onSubmit} className="bar" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      <p className="muted" style={{ fontSize: 12 }}>
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
